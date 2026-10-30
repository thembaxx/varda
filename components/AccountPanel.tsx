"use client";

import { useState } from "react";
import { ArrowRight, SignOut, UserCircle, CheckCircle, LockKey } from "@/components/ui/icons";
import { authClient } from "@/lib/auth-client";
import { useExperience } from "@/components/ExperienceProvider";
import Dialog from "@/components/ui/Dialog";
import EmailCodeSignIn from "@/components/EmailCodeSignIn";

const canUseEmailCode = process.env.NEXT_PUBLIC_VARDA_EMAIL_OTP_ENABLED === "true";

export default function AccountPanel({ onClose }: { onClose: () => void }) {
  const { offline, preferences, update, feedback, notify } = useExperience();
  const { data: session, isPending, error: sessionError } = authClient.useSession();
  const [mode, setMode] = useState<"signin" | "signup" | "code">("signin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || offline) return;
    setPending(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") || "").trim();
    try {
      const result = session
        ? await authClient.updateUser({ name })
        : mode === "signup"
          ? await authClient.signUp.email({
              name,
              email: String(fields.get("email")),
              password: String(fields.get("password")),
            })
          : await authClient.signIn.email({
              email: String(fields.get("email")),
              password: String(fields.get("password")),
            });
      if (result.error) {
        setError(result.error.message || "We couldn’t complete that. Please try again.");
        return;
      }
      if (name) update({ nickname: name.split(" ")[0] });
      feedback("success");
      notify(session ? "Your profile is updated." : "You’re home. Welcome to Varda.");
      onClose();
    } catch {
      setError("We couldn’t connect. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title={session ? "Your little corner" : "Welcome home"} onClose={onClose}>
      <div className="account-avatar">
        <UserCircle size={52} weight="duotone" />
      </div>
      {isPending ? (
        <p className="dialog-intro" role="status">
          Finding your profile…
        </p>
      ) : (
        <>
          <p className="dialog-intro">
            {session ? (
              <>
                Signed in as <strong>{session.user.email}</strong>
              </>
            ) : (
              "Connect with your neighbours and keep your plans in one place."
            )}
          </p>
          {!session && (
            <div className="segmented-control">
              {(["signin", "signup", ...(canUseEmailCode ? ["code" as const] : [])] as const).map(
                (value) => (
                  <button
                    key={value}
                    aria-pressed={mode === value}
                    onClick={() => {
                      setMode(value);
                      setError("");
                    }}
                  >
                    {value === "signin"
                      ? "Sign in"
                      : value === "signup"
                        ? "Create account"
                        : "Email code"}
                  </button>
                ),
              )}
            </div>
          )}
          {mode === "code" && !session ? (
            <EmailCodeSignIn
              offline={offline}
              onSuccess={() => {
                feedback("success");
                notify("You’re home. Welcome to Varda.");
                onClose();
              }}
            />
          ) : (
            <form onSubmit={submit} className="account-form">
              {(session || mode === "signup") && (
                <label>
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                    defaultValue={session?.user.name || preferences.nickname}
                    placeholder="What should we call you?"
                  />
                </label>
              )}
              {!session && (
                <>
                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    Password
                    <input
                      name="password"
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      minLength={10}
                      maxLength={128}
                      required
                      placeholder="At least 10 characters"
                    />
                  </label>
                </>
              )}
              {offline && <p className="form-note">Reconnect to sign in or update your account.</p>}
              {(error || sessionError) && (
                <p role="alert" className="form-error">
                  {error || sessionError?.message || "Accounts are temporarily unavailable."}
                </p>
              )}
              <button type="submit" disabled={pending || offline} className="button button-green">
                {pending
                  ? "One moment…"
                  : session
                    ? "Save profile"
                    : mode === "signup"
                      ? "Find your people"
                      : "Come on in"}
                <ArrowRight size={18} />
              </button>
            </form>
          )}
          {session ? (
            <button
              className="text-button"
              disabled={pending || offline}
              onClick={async () => {
                setPending(true);
                try {
                  const result = await authClient.signOut();
                  if (result.error) throw new Error(result.error.message);
                  update({ nickname: "" });
                  notify("You’re signed out. See you soon.");
                  onClose();
                } catch {
                  setError("Couldn’t sign out. Please try again.");
                } finally {
                  setPending(false);
                }
              }}
            >
              <SignOut size={17} />
              Sign out
            </button>
          ) : (
            <p className="account-security">
              <LockKey size={15} />
              Your account, securely handled by Better Auth.
            </p>
          )}
          {session && (
            <p className="account-security">
              <CheckCircle size={16} />
              Your profile is private until you choose to share.
            </p>
          )}
        </>
      )}
    </Dialog>
  );
}
