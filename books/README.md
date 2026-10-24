# Books

`books.json` lists the books the figures belong to. Each figure's `asset.json` names its book (`"book": "physics-9-10"`),
the printed page (`"page": 21`) and the topic number (`"topic": "1.6.1"`). Page and topic are typed in by hand from
the printed book.

| Field | Meaning |
|---|---|
| `id` | Stable slug used in `asset.json` (`physics-9-10`). Never rename it. |
| `title` | Book title, `bn` and `en`. |
| `subject`, `classes`, `curriculum` | What the book is (for the export catalog). |
| `edition` | The printed edition the page numbers refer to (fill in when known). |
| `chapters` | Optional: chapter numbers and titles, shown in the studio next to the topic. Add a chapter when its first figure arrives. |

To add a book: append an entry with a new `id`, then run `npm run check`.
