Questionnaire UI (Schema‑Driven)

How to run
- Open `index.html` in your browser (no build needed).
- Your answers save to localStorage as a draft.

Customize the questionnaire
This UI renders from a JSON schema embedded in `app.js`.
You can either:
- Edit the `schema` object in `app.js`, or
- Call `setQuestionnaire(yourSchemaObject)` from the browser console, or set `window.__QUESTIONNAIRE__` before `app.js` loads.

Schema shape
- `id` (string): unique key for draft saving.
- `title` (string): form title.
- `sections` (array): top‑level pages with `title` and `fields`.
- Field common props: `id`, `label`, `type`, `required`, `help`, `showIf`, `placeholder`.

Supported field types
- `text` | `email` | `tel` | `date` | `time` | `datetime-local` | `number`
- `textarea`
- `dropdown` with `options: ["A", {value:"B", label:"B Label"}]`
- `single` (radio) with `options` (same shape as dropdown)
- `multi` (checkboxes) with `options`
- `matrix` with `rows: [..]` and `columns: [..]` (one radio per row)
- `rating` with `max` (default 5)
- `repeat` repeatable group with `itemFields` and `minItems` (e.g., list of papers)

Validation
- `required: true` for all field types, including matrix (all rows must be selected) and multi (at least one).
- `number`: `min`, `max`, `step`.
- `tel`: `pattern` (regex string).
- `textarea`: `maxLength`.
- `email`: format checked.
- `repeat`: enforces `minItems`; also validates required subfields per item.

Conditional fields
- Use `showIf: { field: "otherFieldId", equals: "SomeValue" }`.

Output
- On submit, the payload appears under “View submission JSON” and logs to the console.
- No network calls are made by default.
- The submission is automatically downloaded as a JSON file (Blob download) with a filename like `research-questionnaire-YYYYMMDD-HHMMSS.json`.

Import from QQ Docs (guided)
- Use `window.setQuestionnaireFromQQDocs(qqJson)` to import a QQ‑Docs‑like JSON. A best‑effort adapter maps common types:
  - radio→single, checkbox→multi, select→dropdown, text/input→text, textarea→textarea, date/time/datetime, matrix→matrix, score/rating→rating.
- Expected minimal shape:
  - `{ id, title, pages: [{ title, questions: [{ id, type, title, required, options?, rows?, columns?, max? }] }] }`

How to extract QQ JSON in your browser
1) Open the form in Chrome, press F12 for DevTools.
2) Go to Network tab, tick “Preserve log”, reload the page.
3) Filter for XHR/fetch and look for requests whose Preview/Response looks like form metadata (contains questions/options).
4) Right‑click the request → Copy → Copy response. Paste it into the console as `const qq = <PASTE_JSON>;` then run `setQuestionnaireFromQQDocs(qq)`.

If no clear JSON is visible
- Sometimes the page stores data in globals. In Console, try inspecting:
  - `Object.keys(window).filter(k=>/STATE|INIT|STORE|FORM/i.test(k))`
  - If you find an object with questions, pass it to `setQuestionnaireFromQQDocs(...)`.
- As a fallback, paste a simplified object with the minimal shape defined above.

Example snippet
```
{
  id: "demo-questionnaire",
  title: "Student Club Registration",
  sections: [
    {
      id: "profile",
      title: "Basic Information",
      fields: [
        { id: "fullName", label: "Full Name", type: "text", required: true },
        { id: "gender", label: "Gender", type: "single", required: true, options: ["Male","Female"] },
        { id: "phone", label: "Mobile Number", type: "tel", required: true, pattern: "^\\\+?\\\d[\\\d\\\s-]{7,}$" },
        { id: "grade", label: "Year", type: "dropdown", options: ["Freshman","Sophomore"] }
      ]
    }
  ]
}
```

Included example schema
- The default `app.js` ships with a questionnaire titled “研究方向与Pipeline调研”, matching the provided structure:
  - Section 1: Task 概述（研究方向、general pipeline、problems）
  - Section 2: Pipeline Phase 细化与演进（repeat，用于逐个 Phase 描述机制与演进）
  - Section 3: 相关论文与创新机制（repeat，至少 3 篇，每篇含字段并有占位示例）

Server-side save
- Start the bundled server (Node.js required):
  - `node server.js`
  - Opens at `http://localhost:3000` and serves static files.
  - API: `POST /api/submit` saves JSON payloads to `submissions/` as `<id>-YYYYMMDD-HHMMSS.json`.
- Front-end behavior:
  - On submit, it will try to POST to the server automatically.
  - If the server is not running (or when using `file://`), it falls back to downloading the JSON locally.
- Optional: set a custom API base in Console before submit:
  - `window.__API_BASE__ = 'http://localhost:3000'`

Notes
- You can localize labels to any language.
- If you share an outline or screenshot of the QQ Form, I can map it 1:1 into this schema for you.
