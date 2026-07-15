"use strict";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 *
 * @param {object} o
 * @param {string} o.greeting                  
 * @param {string[]} [o.intro]                 
 * @param {Array<[string, any]>} [o.formRows]  
 * @param {string[]} [o.outro]              
 */
function buildEmail({
  greeting,
  intro = [],
  formRows = [],
  outro = [],
}) {
  const p = (t) => `<p>${t}</p>`;

  const details = formRows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([label, v]) => `<p><b>${esc(label)}:</b> ${esc(v)}</p>`)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color:#333;">
      <p>${esc(greeting)},</p>
      ${intro.map(p).join("")}
      ${details}
      ${outro.map(p).join("")}
      <br/>
      <p>Warm regards,<br/>Team Khaki</p>
    </div>
  `;
}

module.exports = { buildEmail, esc };
