# Database Indexing Strategy (Plain-Language Guide)

We rely on a handful of carefully chosen database indexes to keep chat history fast and reliable. This note explains what each index does in everyday terms.

## Why we need indexes at all

- Think of an index like the table of contents in a book. Without it, we have to flip through every page (row) to find what we need.
- Our tables grow over time—more chats, more messages, more stream chunks. Indexes give the database shortcuts so it can answer common questions quickly.
- Each index has a small maintenance cost during writes. We only add one when it removes obvious bottlenecks.

## `chat_sessions`

| Index | What it covers | Plain-language purpose |
| --- | --- | --- |
| `chat_sessions_user_id_idx` | `user_id` | “Show me all chats for this user” without scanning everyone else’s conversations. |
| `chat_sessions_user_active_idx` | `user_id`, `is_active` | Quickly list only the active chats for the signed-in user (the view we show most often). |
| `chat_sessions_active_stream_idx` | `active_stream_id` | When a stream resumes, find which chat owns the stream ID immediately.
| `chat_sessions_last_message_idx` | `last_message_at` | Sort chats by most recent message without walking the entire table. |

## `messages`

| Index | What it covers | Plain-language purpose |
| --- | --- | --- |
| `messages_session_sequence_idx` | `session_id`, `sequence` | Messages stay in order. This index guarantees we never insert two messages into the same position and lets us fetch them in sequence instantly. |
| `messages_session_status_idx` | `session_id`, `status` | “Do I have a message still streaming?” or “Find unfinished messages in this chat” can be answered in one quick lookup. |

## `message_parts`

| Index | What it covers | Plain-language purpose |
| --- | --- | --- |
| `message_parts_message_index_idx` | `message_id`, `part_index` | Keeps every streamed chunk in order. When a stream resumes, we replay pieces in the exact sequence they arrived. |
| `message_parts_message_final_idx` | `message_id`, `is_final` | When we want the latest consolidated version of a message, the database can grab it without re-reading every delta. |

## `resumable_streams`

| Index | What it covers | Plain-language purpose |
| --- | --- | --- |
| `resumable_streams_session_idx` | `session_id` | Each chat can ask, “Do I have a live stream right now?” without scanning the whole stream table. |
| `resumable_streams_status_expiry_idx` | `status`, `expires_at` | Background jobs can quickly find stale streams (e.g., status `active` but expired) to clean up. |

## `message_usage` (optional table)

| Index | What it covers | Plain-language purpose |
| --- | --- | --- |
| Primary key on `message_id` | `message_id` | Every message has at most one usage record; reading the token counts is instant. |

## When to add more indexes

- **Only after real profiling**: extra indexes slow down inserts/updates, so we add them when we have evidence that a query is struggling.
- **Examples of future candidates**:
  - Full-text search on message content (GIN index on `messages.content`).
  - Filtering by message role (`messages.role`) if we build role-specific dashboards.
  - Analytics on stream parts (`message_parts.type`) if we analyze tool usage often.

## Recap

- Every index listed here maps to a deliberate question the app asks the database multiple times a day.
- The combination keeps user-facing views snappy *and* ensures resumable streams can pick up instantly.
- We can always extend this set, but this baseline balances speed with maintenance overhead.


