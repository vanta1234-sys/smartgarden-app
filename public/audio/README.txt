Music beds for the generated Shorts.
====================================

Drop .mp3 files here and the renderer picks one per article automatically — the
choice is derived from the article slug, so re-rendering an article gives the same
track, and consecutive articles get different ones. Remove every file and the videos
go back to narration only.

Where to get tracks
-------------------
YouTube Studio -> Audio Library:  https://studio.youtube.com  (Ρυθμίσεις -> Βιβλιοθήκη ήχου)

Filter for:
  - Attribution: "No attribution required"  (otherwise we owe a credit in every description)
  - Mood: Calm / Inspirational
  - Genre: Ambient / Cinematic
  - Duration: 1 minute or more (it loops, so length does not matter much)

YouTube's own library is used on purpose: those tracks do not raise Content ID
claims on the channel, which "free" music from elsewhere frequently does.

How it is mixed
---------------
Volume 0.11 under the narration, 1.2s fade in, 1.6s fade out before the end, looped
to the length of the video. Mixed with amix normalize=0 so the narration keeps its
level. Applied as a separate pass with -c:v copy, so it never re-encodes the picture.
