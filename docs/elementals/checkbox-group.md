---
layout: poops-docs-theme/docs
title: Checkbox group
description: A select-all checkbox over the checkboxes it stands for — ticked, empty, or showing the dash when it is some of them.
order: 3
---

# `<checkbox-group-elemental>`

The "select all" at the top of a list of checkboxes, per the
[APG Checkbox (Mixed-State) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/):
ticked when all of them are, empty when none are, and showing the dash when it is some of
them. Light DOM, no shadow root, nothing moved or wrapped.

<div class="demo-block">
  <checkbox-group-elemental>
    <label><input type="checkbox"> <strong>All notifications</strong></label>
    <ul>
      <li><label><input type="checkbox" checked> Mentions</label></li>
      <li><label><input type="checkbox"> Replies</label></li>
      <li><label><input type="checkbox" checked> Direct messages</label></li>
    </ul>
  </checkbox-group-elemental>
</div>

```html
<checkbox-group-elemental>
  <label><input type="checkbox" /> All notifications</label>
  <ul>
    <li><label><input type="checkbox" name="n" value="mentions" checked /> Mentions</label></li>
    <li><label><input type="checkbox" name="n" value="replies" /> Replies</label></li>
    <li><label><input type="checkbox" name="n" value="dm" checked /> Direct messages</label></li>
  </ul>
</checkbox-group-elemental>
```

## Why this needs script at all

The dash is `HTMLInputElement.indeterminate`, and
[MDN is explicit](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox#indeterminate_state)
that it can **only be set from JavaScript** — there is no HTML attribute for it. No server,
template or static page can render a checkbox in that state, so the one line of markup that
would have said it has to be script, in every project, every time. That is the gap this
element fills, and the whole of it.

It is also purely visual: what a checkbox submits is decided by `checked` alone, dashed or
not. So the parent is a control, not a value — leave it without a `name` and it stays out
of your form data.

## The three states

| The children | The parent shows | The parent's properties          |
| ------------- | ----------------- | --------------------------------- |
| all ticked   | a tick            | `checked = true`                  |
| none ticked  | an empty box      | `checked = false`                 |
| some ticked  | a dash            | `indeterminate = true`            |

The element writes those two properties and `data-state="all"` / `"some"` / `"none"` on
itself. That is everything — no `role`, no `aria-checked`, because a native checkbox with
`indeterminate` set is **already** announced as mixed.

## Pressing the parent

<kbd>Space</kbd> and a click do the same thing, because on a checkbox
<kbd>Space</kbd> *is* a click. The cycle is the APG's:

| Press | The children go to                                        |
| ------ | ---------------------------------------------------------- |
| from mixed | all on                                                 |
| from all on | all off                                               |
| from all off | **back to the combination they were last mixed in** |

That last step is the reason to have a tri-state parent instead of a two-state one: two
ticks out of twenty are not destroyed by one press, they are one more press away from
coming back. The combination is remembered every time the group becomes mixed — including
one the reader built by hand, and including the one the markup loaded in.

The step is skipped when there is nothing in it worth stopping at — nothing remembered, or
a remembered combination that is all on, all off, or from when the group was a different
size. So the cycle is three steps while there is something to go back to and two while
there is not, rather than having a third step that lands where the second one did.

<!-- demo checkbox-group -->

```html
<checkbox-group-elemental>
  <label><input type="checkbox" /> Select all</label>
  <ul>
    <li><label><input type="checkbox" checked /> Read</label></li>
    <li><label><input type="checkbox" /> Write</label></li>
    <li><label><input type="checkbox" /> Delete</label></li>
    <li><label><input type="checkbox" disabled /> Transfer ownership</label></li>
  </ul>
</checkbox-group-elemental>
```

A disabled checkbox is **outside the set the parent speaks for**: it is never moved, and it
is never counted. So the tick means "everything selectable is selected", and the group above
shows one the moment Read, Write and Delete are ticked — Transfer ownership stays exactly as
it was.

Counting it instead is the obvious reading and it is a trap. A group holding one disabled
and unticked box could never reach "all", so every press would compute "some", set
everything it was allowed to, change nothing, and leave the cycle stuck on the step it was
already on. A control whose state invites a press that does nothing is the worse lie.

## Usage

The parent is **the first checkbox in the element**, in document order, which is where it
has to be for the reader anyway. Everything after it is a child. There is no attribute to
set and nothing to name:

```javascript
import "book-of-elementals/checkbox-group";
```

```scss
@use "book-of-elementals/checkbox-group/style.scss"; // structure
@use "book-of-elementals/checkbox-group/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/checkbox-group.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/checkbox-group.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/checkbox-group-theme.min.css"
/>
```

### One level, not a tree

The pattern is a parent over a flat set of checkboxes, and that is all this is. A group
nested inside another is a **separate** group: it keeps its own checkboxes, and neither
reads nor is read by the one around it. An outer parent left with nothing of its own to
coordinate does nothing at all.

That is a refusal rather than a gap. In a tree the cycle stops being answerable — restoring
a branch's last mixed combination and restoring its parent's are two different restores of
the same boxes, and no press can be both. Write the checkboxes flat, one group per parent.

## API

No attributes. The element reads the checkboxes and writes what it finds:

| What                | Value                                                             |
| -------------------- | ------------------------------------------------------------------ |
| `data-state`        | `all`, `some` or `none` — what the children say                   |
| `parent.checked`    | true when all of them are                                          |
| `parent.indeterminate` | true when some of them are                                      |

### Properties

| Property      | Type                  | Description                                                   |
| -------------- | --------------------- | -------------------------------------------------------------- |
| `parent`      | `HTMLInputElement`    | Read-only. The select-all — the first checkbox in the element. |
| `checkboxes`  | `HTMLInputElement[]`  | Read-only. The ones it stands for, in document order.          |
| `state`       | string                | Read-only. `all`, `some` or `none`.                            |
| `apply()`     | —                     | Re-read the checkboxes. Call it after adding or removing one.  |

### Events

None of its own. The checkboxes are native, so listen for `change` — and the parent fires
one on **every child it changes**, exactly as clicking each of them would have:

```javascript
form.addEventListener("change", (e) => e.target.value);
```

A select-all that moved twelve checkboxes silently would leave every listener downstream of
it holding stale state, so it does not: one `input` and one `change` per checkbox that
actually moved, and none for the ones that were already right.

Setting `.checked` from script fires nothing — that is the platform's rule for every form
control — so redraw with it:

```javascript
const group = document.querySelector("checkbox-group-elemental");

group.checkboxes[0].checked = true;
group.apply();
```

### Styling hooks

```css
checkbox-group-elemental[data-state="some"] {
} /* the group is mixed */
checkbox-group-elemental input:indeterminate {
} /* the parent showing the dash — a native selector, no class needed */
checkbox-group-elemental:not(:defined) {
} /* before upgrade */
```

## In a form

Nothing to wire: the children are the form controls, so they submit, reset and restore
themselves, and a `<fieldset disabled>` takes the whole group down.

```html
<form>
  <fieldset>
    <legend>Notifications</legend>
    <checkbox-group-elemental>
      <label><input type="checkbox" /> All notifications</label>
      <ul>
        <li><label><input type="checkbox" name="n" value="mentions" checked /> Mentions</label></li>
        <li><label><input type="checkbox" name="n" value="dm" /> Direct messages</label></li>
      </ul>
    </checkbox-group-elemental>
  </fieldset>
</form>
```

```javascript
new FormData(form).getAll("n"); // ["mentions"]
```

Checkboxes sharing a name submit one entry each, and none at all when none are ticked — so
a server reading them has to treat "missing" as "none", the same as for a single checkbox.
In PHP and Rails that name wants to be `n[]`.

> [!NOTE]
> **Do not give the parent a `name`.** It is a control over the others, not a value of its
> own, and `indeterminate` does not change what a checkbox submits — a named parent would
> post its value whenever it happened to be ticked, which is a field your server did not
> ask for and cannot interpret.

## Degrading

With no script the parent is a checkbox that ticks itself and commands nothing, which is a
control lying about what it does — so it is not offered at all until the element upgrades.
`style.scss` hides the first checkbox and its label until `:defined`, and what is left is
the plain list of checkboxes it was standing in front of, every one of them working.

That rule reaches a **direct child** and no further, because CSS cannot say "the first
checkbox anywhere below me". Where the parent is deeper — a `<th>` in a table header, which
is where most select-alls live — write `hidden` on it instead and the element removes the
attribute when it upgrades, at any depth. The
[bulk actions example](../examples/bulk-actions.html) is that arrangement end to end.

| Missing                   | What you get                                                    |
| -------------------------- | ---------------------------------------------------------------- |
| The script never loads    | The children, all working. No select-all, rather than a dead one |
| The theme is not imported | Native checkboxes, correctly grouped and indented                |

## The look

`style.scss` is structure only; `theme.scss` is the look and is optional. What the theme
adds of this element's own is one property — the arrangement a lone checkbox has no use
for:

| Property                            | Default  | Description                                 |
| ------------------------------------- | -------- | --------------------------------------------- |
| `--checkbox-group-elemental-indent` | `1.75em` | How far the children sit in from the parent |

The boxes themselves are **not this element's**, though this element is why they exist: the
third state is a dash, and `accent-color` recolours the browser's box while saying nothing
about its size, its corners or the weight of a line through the middle of it. So they are
drawn, in `styles/checkbox.scss`, which the theme imports for you and which any checkbox on
the page can wear. The seven `--checkbox-elemental-*` properties, the `forced-colors`
behaviour and how to point the same look at the rest of your form are all on
[the drawn checkbox](../checkbox.html).

The **Options** tab below turns all eight — the indent above and the seven the boxes share.
Turn them until it looks the way you want, then copy the rule out of the bottom of the
panel:

<!-- demo checkbox-group tab="options" -->

```html
<checkbox-group-elemental>
  <label><input type="checkbox" /> Turn me in the Options tab</label>
  <ul>
    <li><label><input type="checkbox" checked /> One</label></li>
    <li><label><input type="checkbox" /> Two</label></li>
  </ul>
</checkbox-group-elemental>
```

## Select-all, or something else?

| Wanted                                                | Element                                    |
| ------------------------------------------------------ | ------------------------------------------- |
| One switch over a set of checkboxes                    | this                                       |
| One setting that takes effect at once                  | [`<switch-elemental>`](switch.html)        |
| One choice out of a few                                | [`<segmented-elemental>`](segmented.html)  |
| Several values out of many, searchable                 | [`<combobox-elemental>`](combobox.html) with `multiple` |

If the list is long enough that the reader would rather search it than scroll it, a
`multiple` combobox is the better control and its chips are the better summary.

<script src="{{ relativePathPrefix }}dist/elementals/checkbox-group.js"></script>
