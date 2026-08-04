---
layout: poops-docs-theme/docs
title: Bulk actions
description: The select-all in a table header and the toolbar under it — checkbox-group-elemental, the drawn checkbox, and the one event that keeps a count honest.
order: 3
---

# Bulk actions

A checkbox in a table header, a row of buttons that wake up when something is picked, and a
count that says how many. Every list of things you can act on has this, and the header
checkbox is the part everyone writes by hand — because the dash it shows when only some
rows are picked is
[`HTMLInputElement.indeterminate`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox#indeterminate_state),
a property with no HTML attribute behind it.

[`<checkbox-group-elemental>`](../elementals/checkbox-group.html) is that checkbox and
nothing else. The toolbar, the count, the disabled buttons and the layout are the page's,
which is the point of this example. Here is the assembly.

<!-- demo checkbox-group -->

```html
<div class="bulk" role="toolbar" aria-label="Row actions">
  <p class="bulk-count" role="status">Nothing selected</p>
  <button type="button" disabled>Archive</button>
  <button type="button" disabled>Export</button>
  <button type="button" class="danger" disabled>Delete</button>
</div>

<checkbox-group-elemental>
  <table>
    <thead>
      <tr>
        <th class="pick">
          <!-- `hidden` until the element upgrades: with no script this ticks itself and
               commands nothing, and CSS cannot reach a parent this deep to hide it -->
          <input type="checkbox" aria-label="Select all rows" hidden />
        </th>
        <th>Invoice</th>
        <th>Client</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="pick"><input type="checkbox" name="id" value="2401" aria-labelledby="r1" /></td>
        <td id="r1">INV-2401</td>
        <td>Kestrel Cloud</td>
        <td class="num">€1,240.00</td>
      </tr>
      <tr>
        <td class="pick"><input type="checkbox" name="id" value="2402" aria-labelledby="r2" /></td>
        <td id="r2">INV-2402</td>
        <td>Pumpjack Ltd</td>
        <td class="num">€380.00</td>
      </tr>
      <tr>
        <td class="pick"><input type="checkbox" name="id" value="2403" aria-labelledby="r3" /></td>
        <td id="r3">INV-2403</td>
        <td>Sulphuris</td>
        <td class="num">€2,905.50</td>
      </tr>
      <tr>
        <td class="pick"><input type="checkbox" name="id" value="2404" aria-labelledby="r4" /></td>
        <td id="r4">INV-2404</td>
        <td>Argoyle</td>
        <td class="num">€96.00</td>
      </tr>
      <tr>
        <td class="pick">
          <input type="checkbox" name="id" value="2405" aria-labelledby="r5" disabled />
        </td>
        <td id="r5">INV-2405 <span class="note">paid</span></td>
        <td>Poops</td>
        <td class="num">€1,010.00</td>
      </tr>
    </tbody>
  </table>
</checkbox-group-elemental>
```

```css demo
body { margin: 0; padding: 1rem; --line: color-mix(in srgb, currentcolor 15%, transparent); }

.bulk {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.25rem;
}
.bulk-count { flex: 1 1 auto; margin: 0; font-size: 0.9rem; opacity: 0.75; }
.bulk button {
  font: inherit; font-size: 0.85rem; color: inherit; cursor: pointer;
  padding: 0.3rem 0.7rem; border: 1px solid var(--line); border-radius: 0.375rem;
  background: none;
}
.bulk button:hover:not(:disabled) { background: var(--line); }
/* out of reach *and* out of the tab order, because a toolbar of dead buttons is a set of
   tab stops that do nothing — `disabled` is the attribute that does both */
.bulk button:disabled { opacity: 0.45; cursor: not-allowed; }
.bulk .danger:hover:not(:disabled) { color: #d33; border-color: currentcolor; }

table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { padding: 0.5rem 0.6rem; text-align: start; border-bottom: 1px solid var(--line); }
th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; opacity: 0.7; }
.num { text-align: end; font-variant-numeric: tabular-nums; }
.note { font-size: 0.75rem; opacity: 0.6; }
/* the checkbox column is as wide as a checkbox and no wider */
.pick { width: 1px; padding-inline-end: 0; }

/* the row the reader has picked, marked by more than the tick in it */
tr:has(td input:checked) { background: color-mix(in srgb, currentcolor 5%, transparent); }
```

```js demo
const group = document.querySelector("checkbox-group-elemental");
const bar = document.querySelector(".bulk");
const count = document.querySelector(".bulk-count");

// One listener, on the group. `change` bubbles from every checkbox — including the ones the
// select-all moved, because it fires the event each of them would have fired if clicked.
group.addEventListener("change", () => {
  const picked = group.querySelectorAll("tbody input:checked").length;
  count.textContent = picked ? `${picked} selected` : "Nothing selected";
  for (const button of bar.querySelectorAll("button")) button.disabled = !picked;
});
```

## The one event that keeps the count honest

The toolbar is thirteen lines and one listener because the element fires `input` and
`change` on **every checkbox it moves**, in the order a real click on that checkbox would
have fired them. Press the select-all with five rows under it and five `change` events
bubble past the listener.

A select-all that set `.checked` on five inputs and said nothing would leave this count
reading "Nothing selected" over five ticked rows — and every other listener on the page
holding the same stale answer, which is the shape of bug that gets found in production by a
customer whose export contained the wrong invoices. It is also why the listener sits on the
group rather than on each row: one node hears the lot.

## Try the third press

Pick two rows by hand, then press the header checkbox three times:

| Press | The rows       | The header shows |
| ------ | -------------- | ----------------- |
| —     | your two       | the dash          |
| 1     | all of them    | a tick            |
| 2     | none of them   | an empty box      |
| 3     | **your two, back** | the dash      |

That third step is the
[APG's cycle](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) and it earns its keep in a
table more than anywhere else: on two hundred rows, the two you picked are two hundred
clicks to rebuild if one press of the header throws them away. The combination is remembered
every time the group becomes mixed, so the one that comes back is the one you built.

## The header checkbox needs a name

`<th>` gives it a column, not a name. In a header cell there is no visible text to be
labelled by, so the input carries `aria-label="Select all rows"` — without it a screen
reader announces "checkbox, unchecked" and nothing about what it selects.

The row checkboxes have the opposite problem: there *is* text, in the cell beside them, and
it belongs to the row rather than to the box. `aria-labelledby` pointed at the invoice
number's cell is what makes each one announce as "INV-2402, checkbox" rather than as the
fifth anonymous checkbox in a list of five.

## Without the script

The header checkbox is written `hidden`, and the element removes that attribute when it
upgrades. That is the whole of the degradation, and it is deliberate: with no script it
would be a checkbox that ticks itself and commands nothing, which is worse than no
select-all at all — the rows are still there, still tickable, still submitted under their
own `name`.

The element's stylesheet does the same job with `:not(:defined)` for the flat markup on the
[element's own page](../elementals/checkbox-group.html), where the parent is a direct child
of the group. It cannot reach this one: CSS has no way to say "the first checkbox anywhere
below me", and a table puts three elements between the two. `hidden` in the markup works at
any depth, and it is one attribute.

## Selecting a row is not opening it

The checkbox is the only thing in the row that selects it. Making the whole row a click
target is the obvious next idea and it is a trap: rows hold links and buttons, so a click
handler on `<tr>` has to guess which clicks were meant for it, and a keyboard user gets a
target they cannot reach at all. If a row should be openable, put a link in it — that is
what the invoice number is for.

## What the element brought

Everything on this page that is not furniture:

- **The dash**, which is a JavaScript-only property and the reason this is not a stylesheet.
- **The three states stay true**, whichever way the rows move — by hand, by the header, by a
  form reset, or by a back-navigation, which restores checkboxes with no event at all.
- **A press is answerable**, because the cycle is defined for all three states rather than
  being a two-way toggle that pretends the mixed one is not there.
- **The disabled row is out of it entirely** — the paid invoice is never moved and never
  counted, so the header ticks once every row you *can* select is selected. Counting it
  would mean "all" could never be reached and the press would stop doing anything.
- **Every moved checkbox announces itself**, so the count, the toolbar and anything else
  listening are told the same thing at the same time.
- **No roles and no `aria-checked`**, because the checkboxes are real ones and a native
  checkbox with `indeterminate` set is already announced as mixed.

What is left for the page is a toolbar, a count and a table — and none of it is about a
checkbox.

<script src="{{ relativePathPrefix }}dist/elementals/checkbox-group.js"></script>
