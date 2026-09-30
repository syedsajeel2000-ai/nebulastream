"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { useToast } from "./Toast";

export interface ProfileDto {
  id: number;
  profile_name: string;
  avatar: string;
  kids_mode: number;
}

const AVATARS = ["🚀", "🎬", "🎭", "👾", "🦊", "🐙", "🌟", "🎧", "🦉", "🐉", "🎨", "🌻", "🍕", "🛸", "🧁", "🐧"];

export default function ProfileEditor({ profiles, activeId }: { profiles: ProfileDto[]; activeId: number }) {
  const { selectProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🎬");
  const [kids, setKids] = useState(false);
  const [busy, setBusy] = useState(false);

  function startEdit(p: ProfileDto) {
    setEditing(p.id);
    setName(p.profile_name);
    setAvatar(p.avatar);
    setKids(p.kids_mode === 1);
  }

  function resetForm() {
    setEditing(null);
    setCreating(false);
    setName("");
    setAvatar("🎬");
    setKids(false);
  }

  async function save() {
    if (!name.trim()) {
      toast("Profile name is required.", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/profiles", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing ? { id: editing, profileName: name.trim(), avatar, kidsMode: kids } : { profileName: name.trim(), avatar, kidsMode: kids, select: true }
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast(data.error ?? "Could not save the profile.", "error");
        return;
      }
      toast(editing ? "Profile updated." : "Profile created.", "success");
      resetForm();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number, profileName: string) {
    if (profiles.length <= 1) {
      toast("You need at least one profile.", "error");
      return;
    }
    if (!window.confirm(`Delete the profile “${profileName}”? Its history, list and likes will be removed.`)) return;
    const res = await fetch("/api/profiles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast(data.error ?? "Could not delete the profile.", "error");
      return;
    }
    toast(`Deleted “${profileName}”.`, "info");
    router.refresh();
  }

  async function switchTo(id: number) {
    await selectProfile(id);
    toast("Profile switched.", "success");
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {profiles.map((p) => (
          <div
            key={p.id}
            className={`card-surface relative p-5 text-center transition ${activeId === p.id ? "border-[#e50914]/70" : ""}`}
          >
            {activeId === p.id && <span className="badge badge-accent absolute right-2 top-2">Active</span>}
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-3xl">{p.avatar}</div>
            <p className="mt-2 truncate font-bold">{p.profile_name}</p>
            {p.kids_mode === 1 && <p className="text-xs font-bold text-[#f5c518]">🧒 Kids mode</p>}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {activeId !== p.id && (
                <button onClick={() => switchTo(p.id)} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                  Switch
                </button>
              )}
              <button onClick={() => startEdit(p)} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                Edit
              </button>
              <button
                onClick={() => remove(p.id, p.profile_name)}
                className="btn btn-ghost !px-2.5 !py-1.5 text-xs hover:!border-red-400/50 hover:!text-red-300"
                aria-label={`Delete ${p.profile_name}`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            resetForm();
            setCreating(true);
          }}
          className="card-surface grid min-h-[170px] place-items-center border-dashed p-5 text-dim transition hover:border-[#e50914]/60 hover:text-white"
        >
          <span>
            <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full border border-white/15 text-2xl">＋</span>
            <span className="text-sm font-bold">Add Profile</span>
          </span>
        </button>
      </div>

      {(editing !== null || creating) && (
        <div className="card-surface anim-scale-in mt-6 p-5">
          <h3 className="mb-4 font-semibold">{creating ? "New Profile" : "Edit Profile"}</h3>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-dim">Profile name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kids" maxLength={40} />
              <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} className="h-4 w-4 accent-[#e50914]" />
                Kids mode (friendlier catalog signals)
              </label>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-dim">Avatar</p>
              <div className="grid max-w-[220px] grid-cols-8 gap-1">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    aria-label={`Avatar ${a}`}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-lg transition ${
                      avatar === a ? "bg-[#e50914]/25 ring-2 ring-[#e50914]" : "bg-white/5 hover:bg-white/15"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={busy} className="btn btn-accent">
              {busy ? "Saving…" : creating ? "Create Profile" : "Save Changes"}
            </button>
            <button onClick={resetForm} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
