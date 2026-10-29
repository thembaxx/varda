import {randomUUID} from 'node:crypto';
import {getPostgresPool} from './postgres';

export async function listCommunityPosts(userId: string) {
  const result = await getPostgresPool().query<{id: string; title: string; message: string; category: string; createdAt: string; name: string; likes: string; liked: boolean}>(
    `SELECT p.id,p.title,p.message,p.category,p."createdAt",u.name,
      (SELECT COUNT(*) FROM community_like l WHERE l."postId"=p.id) AS likes,
      EXISTS(SELECT 1 FROM community_like l WHERE l."postId"=p.id AND l."userId"=$1) AS liked
      FROM community_post p JOIN "user" u ON u.id=p."authorId"
      ORDER BY p."createdAt" DESC LIMIT 60`,
    [userId],
  );
  return result.rows.map(value => ({...value, likes: Number(value.likes), createdAt: Number(value.createdAt)}));
}

export async function toggleCommunityLike(userId: string, postId: string) {
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    // Serializes this user's toggles for this particular post across all instances.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`post:${postId}:user:${userId}`]);
    const post = await client.query('SELECT id FROM community_post WHERE id=$1', [postId]);
    if (!post.rowCount) { await client.query('COMMIT'); return null; }
    const existing = await client.query('SELECT "postId" FROM community_like WHERE "postId"=$1 AND "userId"=$2', [postId, userId]);
    if (existing.rowCount) {
      await client.query('DELETE FROM community_like WHERE "postId"=$1 AND "userId"=$2', [postId, userId]);
    } else {
      await client.query('INSERT INTO community_like ("postId","userId") VALUES ($1,$2)', [postId, userId]);
    }
    await client.query('COMMIT');
    return !existing.rowCount;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

export async function createCommunityPost(userId: string, title: string, message: string, category: string) {
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`community-rate:${userId}`]);
    const now = Date.now();
    const recent = await client.query('SELECT COUNT(*) AS count FROM community_post WHERE "authorId"=$1 AND "createdAt" > $2', [userId, now - 60000]);
    if (Number(recent.rows[0].count) >= 5) {
      await client.query('ROLLBACK');
      return null;
    }
    const id = randomUUID();
    await client.query(
      'INSERT INTO community_post (id,"authorId",title,message,category,"createdAt") VALUES ($1,$2,$3,$4,$5,$6)',
      [id, userId, title.trim(), message.trim(), category, now],
    );
    await client.query('COMMIT');
    return id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}
