import {getAuth} from '@/lib/auth';
import {getDatabase} from '@/lib/database';
import {isPostgres} from '@/lib/postgres';
import {listCommunityPosts, toggleCommunityLike, createCommunityPost} from '@/lib/community-postgres';
import {randomUUID} from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'no-store'};

export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({headers: request.headers});
    const posts = isPostgres() ? await listCommunityPosts(session?.user.id || '') : getDatabase().prepare(`SELECT p.id, p.title, p.message, p.category, p.createdAt, u.name,
      (SELECT COUNT(*) FROM community_like l WHERE l.postId = p.id) AS likes,
      EXISTS(SELECT 1 FROM community_like l WHERE l.postId = p.id AND l.userId = ?) AS liked
      FROM community_post p JOIN user u ON u.id = p.authorId ORDER BY p.createdAt DESC LIMIT 60`).all(session?.user.id || '');
    return Response.json({posts}, {headers});
  } catch { return Response.json({message: 'The community board is taking a moment. Your saved notes are still available.'}, {status: 503, headers}); }
}

export async function POST(request: Request) {
  try {
    const session = await getAuth().api.getSession({headers: request.headers});
    if (!session) return Response.json({message: 'Sign in to join the conversation.'}, {status: 401, headers});
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return Response.json({message: 'This request isn’t allowed.'}, {status: 403, headers});
    if (Number(request.headers.get('content-length') || 0) > 10_000) return Response.json({message: 'Your note is too long.'}, {status: 413, headers});
    const body = await request.json();
    if (body.action === 'like' && typeof body.id === 'string') {
      if (isPostgres()) {
        const liked = await toggleCommunityLike(session.user.id, body.id);
        return liked === null ? Response.json({message: 'That note is no longer here.'}, {status: 404, headers}) : Response.json({liked}, {headers});
      }
      const db = getDatabase();
      const post = db.prepare('SELECT id FROM community_post WHERE id = ?').get(body.id);
      if (!post) return Response.json({message: 'That note is no longer here.'}, {status: 404, headers});
      const liked = db.transaction(() => {
        const existing = db.prepare('SELECT postId FROM community_like WHERE postId = ? AND userId = ?').get(body.id, session.user.id);
        if (existing) db.prepare('DELETE FROM community_like WHERE postId = ? AND userId = ?').run(body.id, session.user.id);
        else db.prepare('INSERT INTO community_like (postId, userId) VALUES (?, ?)').run(body.id, session.user.id);
        return !existing;
      })();
      return Response.json({liked}, {headers});
    }
    const {title, message, category} = body;
    if (typeof title !== 'string' || title.trim().length < 3 || title.length > 100 || typeof message !== 'string' || message.trim().length < 10 || message.length > 600 || !['Culture', 'Food & drinks', 'Outdoors', 'Work'].includes(category)) {
      return Response.json({message: 'Add a title, a note of 10–600 characters, and a category.'}, {status: 400, headers});
    }
    if (isPostgres()) {
      const id = await createCommunityPost(session.user.id, title, message, category);
      return id ? Response.json({id}, {status: 201, headers}) : Response.json({message: 'Try posting again in a minute.'}, {status: 429, headers});
    }
    const db = getDatabase();
    const recent = db.prepare('SELECT COUNT(*) AS count FROM community_post WHERE authorId = ? AND createdAt > ?').get(session.user.id, Date.now() - 60_000) as {count: number};
    if (recent.count >= 5) return Response.json({message: 'Take a little breath. Try posting again in a minute.'}, {status: 429, headers});
    const id = randomUUID();
    db.prepare('INSERT INTO community_post (id, authorId, title, message, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(id, session.user.id, title.trim(), message.trim(), category, Date.now());
    return Response.json({id}, {status: 201, headers});
  } catch { return Response.json({message: 'Your note couldn’t be shared. Please try again when you’re connected.'}, {status: 503, headers}); }
}
