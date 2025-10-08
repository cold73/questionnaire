// Questionnaire schema-driven UI
// You can replace `schema` below with your own.

const schema = {
  id: "research-questionnaire",
  title: "研究方向与Pipeline调研",
  description: "根据每个问题后的示例进行填写。",
  version: 1,
  sections: [
    {
      id: "task",
      title: "1. Task 概述",
      fields: [
        { id: "researchTasks", label: "请填写你的研究方向，以 task 的形式展示（可多项，换行分隔）", type: "textarea", required: true, placeholder: "e.g., vulnerability detection\ncode generation" },
        { id: "generalPipelineIntro", label: "请填写该 task solution 的 general pipeline，可按 phase 概述", type: "textarea", required: true, placeholder: "e.g., Code clone detection：\n1. Input Space（输入空间）\n2. Representation（表征）\n3. Discrimination function（判别/相似度函数）\n4. Inference（推理 / 检索 / 聚类）\n5. Output" },
        { id: "taskProblems", label: "该 task 的 problem 有哪些（可多项，换行分隔）", type: "textarea", required: true, placeholder: "e.g., improve efficiency\nimprove accuracy" },
      ],
    },
    {
      id: "phases",
      title: "2. Pipeline Phase 细化与演进",
      fields: [
        { id: "phaseMechanisms", label: "请填写该 pipeline 中每个 phase 的经典 mechanism（按时间顺序展示演进）", type: "repeat", required: true, minItems: 1, itemLabel: "Phase",
          hint: "添加一个或多个 Phase（如 Input、Representation、Discrimination、Inference、Output）",
          itemFields: [
            { id: "phaseName", label: "Phase 名称", type: "text", required: true, placeholder: "e.g., Input Space（输入空间）" },
            { id: "mechanisms", label: "经典机制与演进（建议 1.1 / 1.2 编号）", type: "textarea", required: true, placeholder: "示例：\n1.1 代码预处理 / 归一化（删除注释、重命名标识符、格式化）\n→ 有助于减少语法与风格差异带来的噪声，提升一致性与鲁棒性。\n1.2 多语言/跨语言前处理（翻译、语言中性表示）\n→ 支持跨语言，提升通用性与适应性。" }
          ]
        }
      ]
    },
    {
      id: "papers",
      title: "3. 相关论文与创新机制（≥3 篇）",
      fields: [
        { id: "papers", label: "请严格按照格式填写每篇论文的信息（至少 3 篇）", type: "repeat", required: true, minItems: 3, itemLabel: "Paper",
          hint: "至少添加 3 篇论文。建议优先填写自己熟悉的论文。",
          itemFields: [
            { id: "titleVenue", label: "题目 + 会议/期刊-年份", type: "text", required: true, placeholder: "e.g., TreeCen: Building Tree Graph for Scalable Semantic Code Clone Detection (ASE'22)" },
            { id: "paper method", label: "论文提出的方法（按照pipeline的phase填写）", type: "textarea", required: true, placeholder: "- Input：AST \n- Representation：提出采用centrality analysis表征AST节点\n- Discrimination：基于 centrality 向量的相似度\n- Inference：machine learning classifier\n- Output：函数级clone结果（0/1）" },
            { id: "innovation", label: "【创新机制】（用自然语言简述）", type: "textarea", required: true, placeholder: "Representation 层的 ... 机制，如何提升 ... \ne.g., Representation层的“centrality analysis”机制。图论的中心性分析机制能揭示语法树中关键节点的语义影响力，从而提升语义克隆向量表示的判别性与高效检索性能。" },
            { id: "problemsSolved", label: "【解决的Problem】（用逗号分隔）", type: "textarea", required: true, placeholder: "e.g., semantic clone detection, scalable clone detection" }
          ]
        }
      ]
    }
  ],
};

// ---- Runtime state ----
const state = {
  sectionIndex: 0,
  values: loadDraft(schema.id) || {},
  touched: {},
};

// ---- Bootstrapping ----
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".app-title").textContent = schema.title;
  renderSidebar();
  renderSection();
  wireNav();
});

function renderSidebar() {
  const list = document.getElementById("section-list");
  list.innerHTML = "";
  schema.sections.forEach((s, idx) => {
    const li = document.createElement("li");
    li.textContent = s.title;
    if (idx === state.sectionIndex) li.classList.add("active");
    if (isSectionComplete(s)) li.classList.add("completed");
    li.addEventListener("click", () => {
      state.sectionIndex = idx;
      renderSection();
      renderSidebar();
    });
    list.appendChild(li);
  });
}

function renderSection() {
  const section = schema.sections[state.sectionIndex];
  document.getElementById("section-title").textContent = section.title;
  const form = document.getElementById("form");
  form.innerHTML = "";
  section.fields.forEach(field => {
    if (!shouldShow(field)) return;
    const el = renderField(field);
    form.appendChild(el);
  });

  // buttons visibility
  const atFirst = state.sectionIndex === 0;
  const atLast = state.sectionIndex === schema.sections.length - 1;
  document.getElementById("prev").style.display = atFirst ? "none" : "inline-block";
  document.getElementById("next").style.display = atLast ? "none" : "inline-block";
  document.getElementById("submit").style.display = atLast ? "inline-block" : "none";
}

function wireNav() {
  document.getElementById("prev").addEventListener("click", () => {
    if (state.sectionIndex > 0) state.sectionIndex--;
    renderSection();
    renderSidebar();
  });
  document.getElementById("next").addEventListener("click", () => {
    const section = schema.sections[state.sectionIndex];
    if (!validateSection(section)) return;
    if (state.sectionIndex < schema.sections.length - 1) state.sectionIndex++;
    renderSection();
    renderSidebar();
  });
  document.getElementById("save").addEventListener("click", () => {
    saveDraft(schema.id, state.values);
    flashSaved();
  });
  document.getElementById("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    for (let i = 0; i < schema.sections.length; i++) {
      // Validate without trying to render errors for non-current sections
      if (!validateSection(schema.sections[i], false)) {
        state.sectionIndex = i;
        renderSection();
        renderSidebar();
        // Now that the failing section is mounted, render its errors
        validateSection(schema.sections[i], true);
        return;
      }
    }
    const payload = buildPayload();
    document.getElementById("payload").textContent = JSON.stringify(payload, null, 2);
    saveDraft(schema.id, state.values); // update draft
    console.log("Submission payload", payload);
    
    // 总是尝试发送到服务器，不再下载到本地
    try {
      const sent = await trySubmitToServer(payload);
      if (sent) {
        flashSaved("提交成功！数据已发送到服务器");
      } else {
        flashSaved("提交失败，请确保服务器已启动");
        alert("提交失败，请确保服务器已启动。请运行 'node server.js' 启动服务器后再试。");
      }
    } catch (err) {
      console.error("提交错误", err);
      flashSaved("提交出错，请稍后再试");
      alert("提交出错，请稍后再试。错误详情请查看控制台。");
    }
  });
}

function flashSaved(text = "Draft saved") {
  const el = document.getElementById("save-status");
  el.textContent = text;
  el.style.opacity = 1;
  setTimeout(() => (el.style.opacity = 0.5), 1500);
}

// ---- Rendering ----
function renderField(f) {
  const wrap = document.createElement("div");
  wrap.className = "field";

  const header = document.createElement("div");
  header.className = "field-header";
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = f.label;
  header.appendChild(label);
  if (f.required) {
    const req = document.createElement("div");
    req.className = "required";
    req.textContent = "Required";
    header.appendChild(req);
  }
  wrap.appendChild(header);

  const control = document.createElement("div");
  control.className = "control";
  let inputEl;

  const v = getValue(f.id);

  switch (f.type) {
    case "text":
    case "email":
    case "tel":
    case "date":
    case "time":
    case "datetime-local":
    case "number": {
      inputEl = document.createElement("input");
      inputEl.type = f.type === "number" ? "number" : (f.type || "text");
      if (f.placeholder) inputEl.placeholder = f.placeholder;
      if (f.min != null) inputEl.min = f.min;
      if (f.max != null) inputEl.max = f.max;
      if (f.step != null) inputEl.step = f.step;
      if (f.pattern) inputEl.pattern = f.pattern;
      if (v != null) inputEl.value = v;
      inputEl.addEventListener("input", () => setValue(f.id, castInputValue(f, inputEl.value)));
      inputEl.addEventListener("blur", () => touchAndValidate(f, wrap));
      control.appendChild(inputEl);
      break;
    }
    case "textarea": {
      inputEl = document.createElement("textarea");
      if (f.placeholder) inputEl.placeholder = f.placeholder;
      if (f.maxLength != null) inputEl.maxLength = f.maxLength;
      if (v != null) inputEl.value = v;
      inputEl.addEventListener("input", () => setValue(f.id, inputEl.value));
      inputEl.addEventListener("blur", () => touchAndValidate(f, wrap));
      control.appendChild(inputEl);
      break;
    }
    case "dropdown": {
      const sel = document.createElement("select");
      const def = document.createElement("option");
      def.value = ""; def.textContent = "Select..."; sel.appendChild(def);
      f.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt.value || opt; o.textContent = opt.label || opt;
        sel.appendChild(o);
      });
      sel.value = v ?? "";
      sel.addEventListener("change", () => { setValue(f.id, sel.value); rerenderIfConditional(); });
      sel.addEventListener("blur", () => touchAndValidate(f, wrap));
      control.appendChild(sel);
      break;
    }
    case "single": {
      const list = document.createElement("div");
      list.className = "choice-list";
      f.options.forEach((opt, i) => {
        const id = `${f.id}-${i}`;
        const c = document.createElement("label");
        c.className = "choice";
        const input = document.createElement("input");
        input.type = "radio"; input.name = f.id; input.value = opt.value || opt;
        input.id = id; input.checked = v === input.value;
        input.addEventListener("change", () => { setValue(f.id, input.value); rerenderIfConditional(); });
        c.appendChild(input);
        const span = document.createElement("span"); span.textContent = opt.label || opt; c.appendChild(span);
        list.appendChild(c);
      });
      list.addEventListener("blur", () => touchAndValidate(f, wrap), true);
      control.appendChild(list);
      break;
    }
    case "multi": {
      const list = document.createElement("div");
      list.className = "choice-list";
      const current = Array.isArray(v) ? new Set(v) : new Set();
      f.options.forEach((opt, i) => {
        const id = `${f.id}-${i}`;
        const c = document.createElement("label");
        c.className = "choice";
        const input = document.createElement("input");
        input.type = "checkbox"; input.value = opt.value || opt; input.id = id;
        input.checked = current.has(input.value);
        input.addEventListener("change", () => {
          const set = new Set(Array.isArray(state.values[f.id]) ? state.values[f.id] : []);
          if (input.checked) set.add(input.value); else set.delete(input.value);
          setValue(f.id, Array.from(set));
        });
        c.appendChild(input);
        const span = document.createElement("span"); span.textContent = opt.label || opt; c.appendChild(span);
        list.appendChild(c);
      });
      list.addEventListener("blur", () => touchAndValidate(f, wrap), true);
      control.appendChild(list);
      break;
    }
    case "matrix": {
      const table = document.createElement("table");
      table.className = "matrix";
      const thead = document.createElement("thead");
      const trh = document.createElement("tr");
      trh.appendChild(document.createElement("th"));
      f.columns.forEach(col => { const th = document.createElement("th"); th.textContent = col; trh.appendChild(th); });
      thead.appendChild(trh); table.appendChild(thead);

      const tbody = document.createElement("tbody");
      const current = typeof v === "object" && v ? v : {};
      f.rows.forEach((row, rIdx) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th"); th.textContent = row; tr.appendChild(th);
        f.columns.forEach((col, cIdx) => {
          const td = document.createElement("td");
          const id = `${f.id}-${rIdx}-${cIdx}`;
          const input = document.createElement("input"); input.type = "radio"; input.name = `${f.id}-${rIdx}`; input.value = col; input.id = id;
          input.checked = current[row] === col;
          input.addEventListener("change", () => {
            const obj = { ...(state.values[f.id] || {}) };
            obj[row] = col; setValue(f.id, obj);
          });
          td.appendChild(input);
          tbody.appendChild(tr);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      table.addEventListener("blur", () => touchAndValidate(f, wrap), true);
      control.appendChild(table);
      break;
    }
    case "rating": {
      const max = f.max || 5;
      const stars = document.createElement("div"); stars.className = "stars";
      const current = Number(v) || 0;
      for (let i = 1; i <= max; i++) {
        const s = document.createElement("span"); s.className = `star ${i <= current ? "active" : ""}`; s.textContent = "★";
        s.addEventListener("click", () => { setValue(f.id, i); renderSection(); });
        stars.appendChild(s);
      }
      control.appendChild(stars);
      break;
    }
    case "repeat": {
      // Repeatable group: { id, itemLabel?, minItems?, maxItems?, itemFields: [...] }
      const items = Array.isArray(v) ? v : [];
      const list = document.createElement("div"); list.className = "repeat-items";
      const header = document.createElement("div"); header.className = "hint";
      header.textContent = f.hint || "Add one or more items";
      control.appendChild(header);

      const addBtn = document.createElement("button"); addBtn.type = "button"; addBtn.className = "icon"; addBtn.textContent = `+ Add ${f.itemLabel || "Item"}`;
      addBtn.addEventListener("click", () => {
        const next = (Array.isArray(state.values[f.id]) ? state.values[f.id].slice() : []);
        next.push({});
        setValue(f.id, next);
        renderSection();
      });
      control.appendChild(addBtn);

      items.forEach((obj, idx) => {
        const item = document.createElement("div"); item.className = "repeat-item";
        const ih = document.createElement("div"); ih.className = "repeat-item-header";
        ih.textContent = `${f.itemLabel || "Item"} #${idx+1}`;
        item.appendChild(ih);

        // Render subfields (support text/textarea/number/date/time and dropdown minimally)
        (f.itemFields || []).forEach(sf => {
          const subWrap = document.createElement("div"); subWrap.style.marginTop = "6px";
          const lab = document.createElement("div"); lab.className = "subtle"; lab.textContent = sf.label + (sf.required ? " *" : ""); subWrap.appendChild(lab);
          let el;
          const current = (obj || {})[sf.id];
          if (["text","email","tel","date","time","datetime-local","number"].includes(sf.type || "text")) {
            el = document.createElement("input"); el.type = sf.type || "text"; if (sf.placeholder) el.placeholder = sf.placeholder; if (current != null) el.value = current;
            el.addEventListener("input", () => { setRepeatValue(f.id, idx, sf.id, castInputValue(sf, el.value)); });
          } else if (sf.type === "textarea") {
            el = document.createElement("textarea"); if (sf.placeholder) el.placeholder = sf.placeholder; if (sf.maxLength != null) el.maxLength = sf.maxLength; if (current != null) el.value = current;
            el.addEventListener("input", () => { setRepeatValue(f.id, idx, sf.id, el.value); });
          } else if (sf.type === "dropdown") {
            el = document.createElement("select");
            const def = document.createElement("option"); def.value = ""; def.textContent = "Select..."; el.appendChild(def);
            (sf.options || []).forEach(opt => { const o = document.createElement("option"); o.value = opt.value || opt; o.textContent = opt.label || opt; el.appendChild(o); });
            el.value = current ?? ""; el.addEventListener("change", () => setRepeatValue(f.id, idx, sf.id, el.value));
          } else {
            el = document.createElement("div"); el.className = "hint"; el.textContent = `Unsupported subfield type: ${sf.type}`;
          }
          subWrap.appendChild(el);
          if (sf.help) { const h = document.createElement("div"); h.className = "hint"; h.textContent = sf.help; subWrap.appendChild(h); }
          item.appendChild(subWrap);
        });

        const actions = document.createElement("div"); actions.className = "repeat-actions";
        const rm = document.createElement("button"); rm.type = "button"; rm.className = "icon"; rm.textContent = "Remove";
        rm.addEventListener("click", () => {
          const next = (Array.isArray(state.values[f.id]) ? state.values[f.id].slice() : []);
          next.splice(idx,1); setValue(f.id, next); renderSection();
        });
        actions.appendChild(rm);
        item.appendChild(actions);
        list.appendChild(item);
      });

      control.appendChild(list);
      break;
    }
    default: {
      const span = document.createElement("span");
      span.textContent = `Unsupported field type: ${f.type}`;
      control.appendChild(span);
    }
  }

  wrap.appendChild(control);

  if (f.help) {
    const help = document.createElement("div"); help.className = "help"; help.textContent = f.help; wrap.appendChild(help);
  }
  const err = document.createElement("div"); err.className = "error"; err.style.display = "none"; wrap.appendChild(err);

  // initial error if touched
  if (state.touched[f.id]) showError(wrap, validateField(f));

  return wrap;
}

function castInputValue(f, raw) {
  if (f.type === "number") return raw === "" ? null : Number(raw);
  return raw;
}

function getValue(id) { return state.values[id]; }
function setValue(id, val) {
  state.values[id] = val;
  saveDraft(schema.id, state.values, true);
}

function touchAndValidate(f, wrap) {
  state.touched[f.id] = true;
  showError(wrap, validateField(f));
}

function showError(wrap, message) {
  const err = wrap.querySelector(".error");
  if (message) { err.textContent = message; err.style.display = "block"; }
  else { err.textContent = ""; err.style.display = "none"; }
}

function validateSection(section, renderErrors = true) {
  let ok = true;
  const isCurrent = section === schema.sections[state.sectionIndex];
  const form = renderErrors && isCurrent ? document.getElementById("form") : null;
  let idx = 0;
  section.fields.forEach((f) => {
    if (!shouldShow(f)) return;
    const wrap = form ? form.children[idx] : undefined;
    idx++;
    const msg = validateField(f);
    state.touched[f.id] = true;
    if (wrap) showError(wrap, msg);
    if (msg) ok = false;
  });
  return ok;
}

function validateField(f) {
  const v = getValue(f.id);
  if (f.required) {
    if (f.type === "multi" && (!Array.isArray(v) || v.length === 0)) return "Please select at least one option.";
    if (f.type === "matrix") {
      if (!v || Object.keys(v).length < (f.rows?.length || 0)) return "Please answer all rows.";
    } else if (f.type === "repeat") {
      const arr = Array.isArray(v) ? v : [];
      if (arr.length === 0) return "Please add at least one item.";
      if (f.minItems != null && arr.length < f.minItems) return `Add at least ${f.minItems} items.`;
      // Basic per-item required checks
      if (f.itemFields) {
        for (const [idx, item] of arr.entries()) {
          for (const sf of f.itemFields) {
            if (sf.required && (!item || item[sf.id] == null || item[sf.id] === "")) return `${f.itemLabel || "Item"} #${idx+1}: "${sf.label}" is required.`;
          }
        }
      }
    } else if (v == null || v === "") { return "This field is required."; }
  }
  if (f.type === "email" && v) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!re.test(v)) return "Enter a valid email.";
  }
  if (f.type === "tel" && v && f.pattern) {
    try { const re = new RegExp(f.pattern); if (!re.test(v)) return "Enter a valid phone number."; } catch {}
  }
  if (f.type === "number") {
    if (v != null && v !== "") {
      if (f.min != null && v < f.min) return `Must be at least ${f.min}.`;
      if (f.max != null && v > f.max) return `Must be at most ${f.max}.`;
    }
  }
  if (f.maxLength != null && typeof v === "string" && v.length > f.maxLength) return `Limit to ${f.maxLength} characters.`;
  return "";
}

function shouldShow(f) {
  if (!f.showIf) return true;
  const other = state.values[f.showIf.field];
  return other === f.showIf.equals;
}

function rerenderIfConditional() {
  // re-render current section to account for conditional fields
  renderSection();
  renderSidebar();
}

function isSectionComplete(section) {
  return section.fields.filter(shouldShow).every(f => !f.required || !validateField(f));
}

function buildPayload() {
  return {
    id: schema.id,
    title: schema.title,
    submittedAt: new Date().toISOString(),
    answers: { ...state.values },
    meta: { userAgent: navigator.userAgent }
  };
}

// ---- Draft persistence ----
function saveDraft(key, obj, silent) {
  try { localStorage.setItem(`q:${key}`, JSON.stringify(obj)); if (!silent) flashSaved(); } catch {}
}
function loadDraft(key) {
  try { const raw = localStorage.getItem(`q:${key}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ---- Replace schema at runtime ----
// To load your own schema, you can set window.__QUESTIONNAIRE__ before this script,
// or call window.setQuestionnaire(schemaObject) after load.
if (window.__QUESTIONNAIRE__) {
  Object.assign(schema, window.__QUESTIONNAIRE__);
}
window.setQuestionnaire = (next) => {
  while (schema.sections.length) schema.sections.pop();
  Object.assign(schema, next);
  state.sectionIndex = 0;
  state.values = loadDraft(schema.id) || {};
  state.touched = {};
  document.querySelector(".app-title").textContent = schema.title || "Questionnaire";
  renderSidebar();
  renderSection();
};

function setRepeatValue(fieldId, index, subId, val) {
  const arr = Array.isArray(state.values[fieldId]) ? state.values[fieldId].slice() : [];
  const obj = { ...(arr[index] || {}) };
  obj[subId] = val; arr[index] = obj; setValue(fieldId, arr);
}

// ---- QQ Docs-like import adapter ----
// Accepts a "QQ-lite" JSON and maps to this app's schema.
// Expected shape (flexible):
// {
//   id, title,
//   pages: [
//     { title, questions: [
//       { id, type, title, required, options, rows, columns, max }
//     ]}
//   ]
// }
// Type mapping defaults:
//  radio->single, checkbox->multi, select->dropdown,
//  input|text->text, textarea->textarea, date->date, time->time,
//  matrix->matrix, score|rating->rating
function mapQqDocsToSchema(qq) {
  const typeMap = {
    radio: "single",
    checkbox: "multi",
    select: "dropdown",
    text: "text",
    input: "text",
    textarea: "textarea",
    date: "date",
    time: "time",
    datetime: "datetime-local",
    matrix: "matrix",
    score: "rating",
    rating: "rating",
    number: "number",
  };

  const sections = (qq.pages || qq.sections || []).map((p, si) => ({
    id: p.id || `p${si+1}`,
    title: p.title || `Section ${si+1}`,
    fields: (p.questions || p.fields || []).map((q, qi) => {
      const t = (q.type || "text").toString().toLowerCase();
      const mapped = typeMap[t] || q.type || "text";
      const base = {
        id: q.id || q.key || `q${si+1}_${qi+1}`,
        label: q.title || q.label || `Question ${qi+1}`,
        type: mapped,
        required: !!q.required,
        help: q.help || q.desc || undefined,
      };
      if (q.placeholder) base.placeholder = q.placeholder;
      if (Array.isArray(q.options)) base.options = q.options.map(o => (typeof o === 'string' ? o : (o.label || o.text || o.name || o.value)));
      if (Array.isArray(q.rows)) base.rows = q.rows.map(r => (typeof r === 'string' ? r : (r.label || r.text || r.name || r.value)));
      if (Array.isArray(q.columns)) base.columns = q.columns.map(c => (typeof c === 'string' ? c : (c.label || c.text || c.name || c.value)));
      if (q.max != null) base.max = q.max;
      if (q.min != null) base.min = q.min;
      if (q.step != null) base.step = q.step;
      // simple conditional support if qq uses showIf
      if (q.showIf) base.showIf = q.showIf;
      return base;
    })
  }));

  return {
    id: qq.id || "qq-import",
    title: qq.title || "Imported Questionnaire",
    version: 1,
    sections,
  };
}

window.setQuestionnaireFromQQDocs = (qq) => {
  const mapped = mapQqDocsToSchema(qq);
  window.setQuestionnaire(mapped);
};

// ---- File download helpers ----
function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

function formatTimestamp(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function trySubmitToServer(payload) {
  const isFile = location.protocol === 'file:' || location.origin === 'null';
  const base = window.__API_BASE__ || (isFile ? 'http://localhost:3000' : '');
  const url = `${base}/api/submit`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return false;
    const json = await res.json().catch(() => ({}));
    return !!json.ok;
  } catch (e) {
    clearTimeout(t);
    return false;
  }
}
