export function DefaultAccessibilityContent() {
  return (
    <div className="space-y-10 text-sm leading-6 [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_figure]:mt-3 [&_figure]:overflow-x-auto [&_figure]:rounded-md [&_figure]:border [&_figure]:border-border [&_table]:w-full [&_table]:min-w-240 [&_table]:table-fixed [&_table]:border-collapse [&_thead_th]:bg-muted/50 [&_thead_th]:text-left [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wide [&_thead_th]:text-muted-foreground [&_thead_th]:p-3 [&_thead_th]:align-top [&_thead_th:nth-child(1)]:w-[44%] [&_thead_th:nth-child(2)]:w-[16%] [&_thead_th:nth-child(3)]:w-[40%] [&_tbody_tr]:border-t [&_tbody_tr]:border-border [&_tbody_th]:p-3 [&_tbody_td]:p-3 [&_tbody_th]:align-top [&_tbody_td]:align-top [&_tbody_th]:text-left [&_tbody_th]:font-semibold [&_tbody_td]:font-normal [&_p]:m-0 [&_p+*]:mt-2 [&_ul]:mt-2 [&_ul]:pl-5 [&_li]:mt-1 [&_a]:underline [&_a]:underline-offset-2">
      <h2>WCAG 2.2 Level A</h2>

      <figure>
        <table>
          <thead>
            <tr>
              <th scope="col">Criteria</th>
              <th scope="col">Conformance Level [a]</th>
              <th scope="col">Remarks and Explanations</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#text-equiv-all">
                    1.1.1 Non-text Content
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.1.1 (Web)</li>
                      <li>10.1.1.1 (Non-web document)</li>
                      <li>11.1.1.1.1 (Open Functionality Software)</li>
                      <li>11.1.1.1.2 (Closed Functionality Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product provides text alternatives for meaningful non-text
                  content. Images, icons, graphical controls, and other visual
                  elements expose equivalent accessible text to assistive
                  technologies. Decorative content is implemented so that it is
                  ignored by screen readers.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-av-only-alt">
                    1.2.1 Audio-only and Video-only (Prerecorded)
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.2.1 (Web)</li>
                      <li>10.1.2.1 (Non-web document)</li>
                      <li>11.1.2.1.1 (Open Functionality Software)</li>
                      <li>11.1.2.1.2.1 and 11.1.2.1.2.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no prerecorded audio or video in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-captions">
                    1.2.2 Captions (Prerecorded)
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.2.2 (Web)</li>
                      <li>10.1.2.2 (Non-web document)</li>
                      <li>11.1.2.2 (Open Functionality Software)</li>
                      <li>11.1.2.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no prerecorded audio or video in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-audio-desc">
                    1.2.3 Audio Description or Media Alternative (Prerecorded)
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.2.3 (Web)</li>
                      <li>10.1.2.3 (Non-web document)</li>
                      <li>11.1.2.3.1 (Open Functionality Software)</li>
                      <li>11.1.2.3.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no prerecorded audio or video in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic">
                    1.3.1 Info and Relationships
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.3.1 (Web)</li>
                      <li>10.1.3.1 (Non-web document)</li>
                      <li>11.1.3.1.1 (Open Functionality Software)</li>
                      <li>11.1.3.1.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Partially Supports</p>
              </td>
              <td>
                <p>
                  Information, structure, and relationships are programmatically
                  conveyed. However, the “What’s Here” label is also visually
                  styled as a heading, but is not implemented using a semantic
                  heading element.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#content-structure-separation-sequence">
                    1.3.2 Meaningful Sequence
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.3.2 (Web)</li>
                      <li>10.1.3.2 (Non-web document)</li>
                      <li>11.1.3.2.1 (Open Functionality Software)</li>
                      <li>11.1.3.2.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product presents content in a reading order that correctly
                  communicates its meaning, and the correct reading sequence can
                  be programmatically determined.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#content-structure-separation-understanding">
                    1.3.3 Sensory Characteristics
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.3.3 (Web)</li>
                      <li>10.1.3.3 (Non-web document)</li>
                      <li>11.1.3.3 (Open Functionality Software)</li>
                      <li>11.1.3.3 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  There are no instructions provided for understanding and
                  operating the product that rely on sensory characteristics of
                  components such as shape, color, size, visual location,
                  orientation, or sound.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-without-color">
                    1.4.1 Use of Color
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.4.1 (Web)</li>
                      <li>10.1.4.1 (Non-web document)</li>
                      <li>11.1.4.1 (Open Functionality Software)</li>
                      <li>11.1.4.1 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Color is not used as the only visual means of conveying
                  information, indicating an action, prompting a response, or
                  distinguishing a visual element. Where color is used as an
                  indicator, a distinguishable icon, or visible number and text
                  is also present.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-dis-audio">
                    1.4.2 Audio Control
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.4.2 (Web)</li>
                      <li>10.1.4.2 (Non-web document)</li>
                      <li>11.1.4.2 (Open Functionality Software)</li>
                      <li>11.1.4.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no audio that plays automatically.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#keyboard-operation-keyboard-operable">
                    2.1.1 Keyboard
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.1.1 (Web)</li>
                      <li>10.2.1.1 (Non-web document)</li>
                      <li>11.2.1.1.1 (Open Functionality Software)</li>
                      <li>11.2.1.1.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  All functionality of the product is operable through a
                  keyboard interface without requiring specific timings for
                  individual keystrokes.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#keyboard-operation-trapping">
                    2.1.2 No Keyboard Trap
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.1.2 (Web)</li>
                      <li>10.2.1.2 (Non-web document)</li>
                      <li>11.2.1.2 (Open Functionality Software)</li>
                      <li>11.2.1.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>There are no keyboard traps present in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#character-key-shortcuts">
                    2.1.4 Character Key Shortcuts
                  </a>{' '}(Level A 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.2.1.4 (Web)</li>
                  <li>10.2.1.4 (Non-web document)</li>
                  <li>11.2.1.4.1 (Open Functionality Software)</li>
                  <li>11.2.1.4.2 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There are no keyboard shortcuts in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#time-limits-required-behaviors">
                    2.2.1 Timing Adjustable
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.2.1 (Web)</li>
                      <li>10.2.2.1 (Non-web document)</li>
                      <li>11.2.2.1 (Open Functionality Software)</li>
                      <li>11.2.2.1 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  No timing-related barriers were identified during validation.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#time-limits-pause">
                    2.2.2 Pause, Stop, Hide
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.2.2 (Web)</li>
                      <li>10.2.2.2 (Non-web document)</li>
                      <li>11.2.2.2 (Open Functionality Software)</li>
                      <li>11.2.2.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  There is no moving, blinking, scrolling, or auto-updating
                  content in the products.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#seizure-does-not-violate">
                    2.3.1 Three Flashes or Below Threshold
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.3.1 (Web)</li>
                      <li>10.2.3.1 (Non-web document)</li>
                      <li>11.2.3.1 (Open Functionality Software)</li>
                      <li>11.2.3.1 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product does not contain flashing content or anything that
                  flashes more than three times per second.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-skip">
                    2.4.1 Bypass Blocks
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.4.1 (Web)</li>
                      <li>10.2.4.1 (Non-web document) – Does not apply</li>
                      <li>
                        11.2.4.1 (Open Functionality Software) – Does not apply
                      </li>
                      <li>11.2.4.1 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>
                        501 (Web) (Software) – Does not apply to non-web software
                      </li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>
                        602.3 (Support Docs) – Does not apply to non-web docs
                      </li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  A mechanism is available to bypass repeated content and
                  navigate directly to the main content areas of the page.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-title">
                    2.4.2 Page Titled
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.4.2 (Web)</li>
                      <li>10.2.4.2 (Non-web document)</li>
                      <li>
                        11.2.4.2 (Open Functionality Software) - Does not apply
                      </li>
                      <li>11.2.4.2 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product provides descriptive and meaningful page titles
                  that identify the purpose or topic of each page and support
                  efficient navigation for assistive technology users.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-order">
                    2.4.3 Focus Order
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.4.3 (Web)</li>
                      <li>10.2.4.3 (Non-web document)</li>
                      <li>11.2.4.3 (Open Functionality Software)</li>
                      <li>11.2.4.3 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Interactive elements receive focus in a logical and meaningful
                  sequence that preserves operability and understanding during
                  keyboard navigation.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-refs">
                    2.4.4 Link Purpose (In Context)
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.4.4 (Web)</li>
                      <li>10.2.4.4 (Non-web document)</li>
                      <li>11.2.4.4 (Open Functionality Software)</li>
                      <li>11.2.4.4 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Link purpose can be determined from the link text and its
                  surrounding context, allowing users to understand the
                  destination or function of links.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#pointer-gestures">
                    2.5.1 Pointer Gestures
                  </a>{' '}(Level A 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.2.5.1 (Web)</li>
                  <li>10.2.5.1 (Non-web document)</li>
                  <li>11.2.5.1 (Open Functionality Software)</li>
                  <li>11.2.5.1 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  There is no functionality that uses multipoint or path-based
                  gestures for operation in the product.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#pointer-cancellation">
                    2.5.2 Pointer Cancellation
                  </a>{' '}(Level A 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.2.5.2 (Web)</li>
                  <li>10.2.5.2 (Non-web document)</li>
                  <li>11.2.5.2 (Open Functionality Software)</li>
                  <li>11.2.5.2 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  All pointer-triggered events in the product happen on the
                  up-event, and it is possible for users to cancel interactions
                  mid-click.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#label-in-name">
                    2.5.3 Label in Name
                  </a>{' '}(Level A 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.2.5.3 (Web)</li>
                  <li>10.2.5.3 (Non-web document)</li>
                  <li>11.2.5.3.1 (Open Functionality Software)</li>
                  <li>11.2.5.3.2 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product supports this criterion. Accessible names for
                  interactive controls appropriately contain the visible text
                  label, supporting consistent interaction for speech
                  recognition and assistive technology users.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#motion-actuation">
                    2.5.4 Motion Actuation
                  </a>{' '}(Level A 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.2.5.4 (Web)</li>
                  <li>10.2.5.4 (Non-web document)</li>
                  <li>11.2.5.4 (Open Functionality Software)</li>
                  <li>11.2.5.4 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  There is no functionality in the product that is operated by
                  device motion or user motion.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#meaning-doc-lang-id">
                    3.1.1 Language of Page
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.1.1 (Web)</li>
                      <li>10.3.1.1 (Non-web document)</li>
                      <li>11.3.1.1.1 (Open Functionality Software)</li>
                      <li>11.3.1.1.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product specifies the default human language of each page
                  programmatically, enabling assistive technologies to present
                  content using the appropriate pronunciation and language
                  settings.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-receive-focus">
                    3.2.1 On Focus
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.2.1 (Web)</li>
                      <li>10.3.2.1 (Non-web document)</li>
                      <li>11.3.2.1 (Open Functionality Software)</li>
                      <li>11.3.2.1 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  There are no components in the product that initiate a change
                  of context when focused with a keyboard.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-unpredictable-change">
                    3.2.2 On Input
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.2.2 (Web)</li>
                      <li>10.3.2.2 (Non-web document)</li>
                      <li>11.3.2.2 (Open Functionality Software)</li>
                      <li>11.3.2.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  User interface components do not initiate unexpected changes
                  of context when receiving input, allowing users to interact
                  with form controls predictably.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#consistent-help">
                    3.2.6 Consistent Help
                  </a>{' '}(Level A 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product&#039;s content does not include help mechanisms or
                  support features for front-end user navigation or
                  understanding.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#minimize-error-identified">
                    3.3.1 Error Identification
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.3.1 (Web)</li>
                      <li>10.3.3.1 (Non-web document)</li>
                      <li>11.3.3.1.1 (Open Functionality Software)</li>
                      <li>11.3.3.1.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  If an input error is automatically detected, the item that is
                  in error is identified and the error is described to the user
                  in text.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#minimize-error-cues">
                    3.3.2 Labels or Instructions
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.3.2 (Web)</li>
                      <li>10.3.3.2 (Non-web document)</li>
                      <li>11.3.3.2 (Open Functionality Software)</li>
                      <li>11.3.3.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Labels and instructions are provided where user input is
                  required to help users understand the purpose and expected
                  format of form fields and controls.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#redundant-entry">
                    3.3.7 Redundant Entry
                  </a>{' '}(Level A 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product does not have scenarios that require users to
                  re-enter information during the same process. When a logged-in
                  user makes a purchase, any information saved on their user
                  account (such as email or billing address) is pre-filled in on
                  the checkout page. Customers can save payment information to
                  their account for easier re-entry.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#ensure-compat-parses">
                    4.1.1 Parsing
                  </a>{' '}(Level A)
                </p>
                <p>Applies to:</p>
                <p>WCAG 2.0 and 2.1 – Always answer ‘Supports’</p>
                <p>WCAG 2.2 (obsolete and removed) - Does not apply</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.4.1.1 (Web)</li>
                      <li>10.4.1.1 (Non-web document)</li>
                      <li>11.4.1.1.1 (Open Functionality Software)</li>
                      <li>11.4.1.1.2 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  For WCAG 2.0, 2.1, EN 301 549, and Revised 508 Standards, the
                  September 2023 errata update indicates this criterion is
                  always supported. See the
                  <a href="https://www.w3.org/WAI/WCAG20/errata/#editorial">
                    WCAG 2.0 Editorial Errata
                  </a>
                  and the
                  <a href="https://www.w3.org/WAI/WCAG21/errata/#editorial">
                    WCAG 2.1 Editorial Errata
                  </a>
                  .
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#ensure-compat-rsv">
                    4.1.2 Name, Role, Value
                  </a>{' '}(Level A)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.4.1.2 (Web)</li>
                      <li>10.4.1.2 (Non-web document)</li>
                      <li>11.4.1.2.1 (Open Functionality Software)</li>
                      <li>11.4.1.2.2 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product supports this criterion. User interface components
                  provide appropriate programmatic identification for names,
                  roles, states, and values, enabling compatibility with
                  assistive technologies and supporting consistent interaction
                  behavior.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </figure>

      <h2>WCAG 2.2 Level AA</h2>

      <figure>
        <table>
          <thead>
            <tr>
              <th scope="col">Criteria</th>
              <th scope="col">Conformance Level</th>
              <th scope="col">Remarks and Explanations</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-real-time-captions">
                    1.2.4 Captions (Live)
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.2.4 (Web)</li>
                      <li>10.1.2.4 (Non-web document)</li>
                      <li>11.1.2.4 (Open Functionality Software)</li>
                      <li>11.1.2.4 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There are no live videos in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-audio-desc-only">
                    1.2.5 Audio Description (Prerecorded)
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.2.5 (Web)</li>
                      <li>10.1.2.5 (Non-web document)</li>
                      <li>11.1.2.5 (Open Functionality Software)</li>
                      <li>11.1.2.5 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no prerecorded video in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#orientation">
                    1.3.4 Orientation
                  </a>{' '}(Level AA 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.1.3.4 (Web)</li>
                  <li>10.1.3.4 (Non-web document)</li>
                  <li>11.1.3.4 (Open Functionality Software)</li>
                  <li>11.1.3.4 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product supports the use of both portrait and landscape
                  orientations without restricting functionality or content
                  display, except where a specific display orientation is
                  essential.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#identify-input-purpose">
                    1.3.5 Identify Input Purpose
                  </a>{' '}(Level AA 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.1.3.5 (Web)</li>
                  <li>10.1.3.5 (Non-web document)</li>
                  <li>11.1.3.5.1 (Open Functionality Software)</li>
                  <li>11.1.3.5.2 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product uses appropriate programmatic identification for
                  user input fields that collect personal information, including
                  the use of HTML autocomplete attributes where applicable.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast">
                    1.4.3 Contrast (Minimum)
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.4.3 (Web)</li>
                      <li>10.1.4.3 (Non-web document)</li>
                      <li>11.1.4.3 (Open Functionality Software)</li>
                      <li>11.1.4.3 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Text and interactive elements maintain sufficient color
                  contrast against adjacent backgrounds.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-scale">
                    1.4.4 Resize text
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.4.4 (Web)</li>
                      <li>10.1.4.4 (Non-web document)</li>
                      <li>11.1.4.4.1 (Open Functionality Software)</li>
                      <li>11.1.4.4.2 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Content supports text resizing and browser zoom up to 200%
                  without loss of functionality.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-text-presentation">
                    1.4.5 Images of Text
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.1.4.5 (Web)</li>
                      <li>10.1.4.5 (Non-web document)</li>
                      <li>11.1.4.5.1 (Open Functionality Software)</li>
                      <li>11.1.4.5.2 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>There are no images of text in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#reflow">
                    1.4.10 Reflow
                  </a>{' '}(Level AA 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.1.4.10 (Web)</li>
                  <li>10.1.4.10 (Non-web document)</li>
                  <li>11.1.4.10 (Open Functionality Software)</li>
                  <li>11.1.4.10 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Content supports reflow at 400% browser zoom without loss of
                  information or functionality.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#non-text-contrast">
                    1.4.11 Non-text Contrast
                  </a>{' '}(Level AA 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.1.4.11 (Web)</li>
                  <li>10.1.4.11 (Non-web document)</li>
                  <li>11.1.4.11 (Open Functionality Software)</li>
                  <li>11.1.4.11 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product provides sufficient contrast for visual
                  indicators, graphical objects, and user interface components
                  against adjacent colors.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#text-spacing">
                    1.4.12 Text Spacing
                  </a>{' '}(Level AA 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.1.4.12 (Web)</li>
                  <li>10.1.4.12 (Non-web document)</li>
                  <li>11.1.4.12 (Open Functionality Software)</li>
                  <li>11.1.4.12 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Text content and functionality remain available when text
                  spacing styles are adjusted in accordance with WCAG
                  requirements, without loss of content or functionality.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#content-on-hover-or-focus">
                    1.4.13 Content on Hover or Focus
                  </a>{' '}(Level AA 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.1.4.13 (Web)</li>
                  <li>10.1.4.13 (Non-web document)</li>
                  <li>11.1.4.13 (Open Functionality Software)</li>
                  <li>11.1.4.13 (Closed Software)</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  There is no content displayed on hover or focus in the
                  product.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-mult-loc">
                    2.4.5 Multiple Ways
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.4.5 (Web)</li>
                      <li>10.2.4.5 (Non-web document) – Does not apply</li>
                      <li>
                        11.2.4.5 (Open Functionality Software) – Does not apply
                      </li>
                      <li>11.2.4.5 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>
                        501 (Web) (Software) – Does not apply to non-web software
                      </li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>
                        602.3 (Support Docs) – Does not apply to non-web docs
                      </li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>This criterion does not apply to the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-descriptive">
                    2.4.6 Headings and Labels
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.4.6 (Web)</li>
                      <li>10.2.4.6 (Non-web document)</li>
                      <li>11.2.4.6 (Open Functionality Software)</li>
                      <li>11.2.4.6 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Most headings and labels appropriately describe content
                  structure and form controls.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-visible">
                    2.4.7 Focus Visible
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.2.4.7 (Web)</li>
                      <li>10.2.4.7 (Non-web document)</li>
                      <li>11.2.4.7 (Open Functionality Software)</li>
                      <li>11.2.4.7 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  There is a visible focus indicator on all focusable elements.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum">
                    2.4.11 Focus Not Obscured (Minimum)
                  </a>{' '}(Level AA 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  When a user interface component receives keyboard focus, it
                  remains fully visible and is not obstructed by author-created
                  content.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#dragging-movements">
                    2.5.7 Dragging Movements
                  </a>{' '}(Level AA 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product does not include content that relies on dragging
                  movements for functionality.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#target-size-minimum">
                    2.5.8 Target Size (Minimum)
                  </a>{' '}(Level AA 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Interactive controls provide sufficient target size and
                  spacing to support accurate selection and interaction across
                  input methods.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#meaning-other-lang-id">
                    3.1.2 Language of Parts
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.1.2 (Web)</li>
                      <li>10.3.1.2 (Non-web document)</li>
                      <li>
                        11.3.1.2 (Open Functionality Software) – Does not apply
                      </li>
                      <li>11.3.1.2 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product&#039;s content only includes the default language,
                  with no additional languages.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-locations">
                    3.2.3 Consistent Navigation
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.2.3 (Web)</li>
                      <li>10.3.2.3 (Non-web document) – Does not apply</li>
                      <li>
                        11.3.2.3 (Open Functionality Software) – Does not apply
                      </li>
                      <li>11.3.2.3 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>
                        501 (Web) (Software) – Does not apply to non-web software
                      </li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>
                        602.3 (Support Docs) – Does not apply to non-web docs
                      </li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product provides consistent navigation mechanisms across
                  pages and views, helping users predictably locate and access
                  functionality throughout the experience.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-functionality">
                    3.2.4 Consistent Identification
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.2.4 (Web)</li>
                      <li>10.3.2.4 (Non-web document) – Does not apply</li>
                      <li>
                        11.3.2.4 (Open Functionality Software) – Does not apply
                      </li>
                      <li>11.3.2.4 (Closed Software) – Does not apply</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>
                        501 (Web) (Software) – Does not apply to non-web software
                      </li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>
                        602.3 (Support Docs) – Does not apply to non-web docs
                      </li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Components that have the same functionality are identified
                  consistently.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#minimize-error-suggestions">
                    3.3.3 Error Suggestion
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.3.3 (Web)</li>
                      <li>10.3.3.3 (Non-web document)</li>
                      <li>11.3.3.3 (Open Functionality Software)</li>
                      <li>11.3.3.3 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product provides clear error identification and, where
                  user input errors are detected, appropriate suggestions are
                  provided to help users understand and correct the issue.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#minimize-error-reversible">
                    3.3.4 Error Prevention (Legal, Financial, Data)
                  </a>{' '}(Level AA)
                </p>
                <p>Also applies to:</p>
                <ul>
                  <li>
                    EN 301 549 Criteria
                    <ul>
                      <li>9.3.3.4 (Web)</li>
                      <li>10.3.3.4 (Non-web document)</li>
                      <li>11.3.3.4 (Open Functionality Software)</li>
                      <li>11.3.3.4 (Closed Software)</li>
                      <li>11.8.2 (Authoring Tool)</li>
                      <li>12.1.2 (Product Docs)</li>
                      <li>12.2.4 (Support Docs)</li>
                    </ul>
                  </li>
                  <li>
                    Revised Section 508
                    <ul>
                      <li>501 (Web) (Software)</li>
                      <li>504.2 (Authoring Tool)</li>
                      <li>602.3 (Support Docs)</li>
                    </ul>
                  </li>
                </ul>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product does not include legal commitments, financial
                  transactions, or user-submitted data workflows requiring
                  reversible, reviewable, or confirmable submissions under this
                  criterion.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#accessible-authentication-minimum">
                    3.3.8 Accessible Authentication (Minimum)
                  </a>{' '}(Level AA 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product does not rely on cognitive function tests for
                  authentication and supports authentication methods that can be
                  completed without requiring users to memorize, transcribe, or
                  solve complex cognitive tasks.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#status-messages">
                    4.1.3 Status Messages
                  </a>{' '}(Level AA 2.1 and 2.2)
                </p>
                <p>Also applies to:</p>
                <p>EN 301 549 Criteria</p>
                <ul>
                  <li>9.4.1.3 (Web)</li>
                  <li>10.4.1.3 (Non-web document)</li>
                  <li>11.4.1.3 (Open Functionality Software)</li>
                  <li>11.4.1.3 (Closed Software) – Does not apply</li>
                  <li>11.8.2 (Authoring Tool)</li>
                  <li>12.1.2 (Product Docs)</li>
                  <li>12.2.4 (Support Docs)</li>
                </ul>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Status messages are communicated programmatically to assistive
                  technologies without requiring focus changes, and important
                  structural relationships are conveyed appropriately to support
                  accessible interaction and understanding.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </figure>

      <h2>WCAG 2.2 Level AAA</h2>

      <figure>
        <table>
          <thead>
            <tr>
              <th scope="col">Criteria</th>
              <th scope="col">Conformance Level</th>
              <th scope="col">Remarks and Explanations</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-sign">
                    1.2.6 Sign Language (Prerecorded)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no prerecorded video in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-extended-ad">
                    1.2.7 Extended Audio Description (Prerecorded)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no prerecorded video in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-text-doc">
                    1.2.8 Media Alternative (Prerecorded)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no prerecorded video in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#media-equiv-live-audio-only">
                    1.2.9 Audio-only (Live)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no live audio in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#identify-purpose">
                    1.3.6 Identify Purpose
                  </a>{' '}(Level AAA 2.1 and 2.2)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product uses appropriate semantic structure and
                  programmatic identification to help assistive technologies
                  determine the purpose of common user interface components and
                  input fields where supported by current technologies.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast7">
                    1.4.6 Contrast (Enhanced)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  All text in the product has a contrast ratio of at least 7:1
                  with the background.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-noaudio">
                    1.4.7 Low or No Background Audio
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>There is no prerecorded video or audio in the product.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-visual-presentation">
                    1.4.8 Visual Presentation
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product supports user customization of visual presentation
                  through standard browser and operating system settings,
                  including text spacing, resizing, and reflow behaviors,
                  without loss of content or functionality.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#visual-audio-contrast-text-images">
                    1.4.9 Images of Text (No Exception)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>There are no images of text in the products.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#keyboard-operation-all-funcs">
                    2.1.3 Keyboard (No Exception)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  All functionality of the product is operable through a
                  keyboard interface without requiring specific timings for
                  individual keystrokes.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#time-limits-no-exceptions">
                    2.2.3 No Timing
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Timing is not an essential part of the event or activity
                  presented by the product.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#time-limits-postponed">
                    2.2.4 Interruptions
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  There are no auto-updating content or other interruptions in
                  the product.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#time-limits-server-timeout">
                    2.2.5 Re-authenticating
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product does not require users to re-authenticate during a
                  session. Therefore, this criterion is not applicable.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#timeouts">
                    2.2.6 Timeouts
                  </a>{' '}(Level AAA 2.1 and 2.2)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The products do not contain or trigger timeouts which could
                  result in a loss of data.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#seizure-three-times">
                    2.3.2 Three Flashes
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product does not contain flashing content or anything that
                  flashes more than three times per second.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#animation-from-interactions">
                    2.3.3 Animation from Interactions
                  </a>{' '}(Level AAA 2.1 and 2.2)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product does not contain animations from interactions.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-location">
                    2.4.8 Location
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product provides mechanisms that allow users to determine
                  their current location within the interface through consistent
                  navigation structure, page titles, headings, and other
                  contextual indicators.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-link">
                    2.4.9 Link Purpose (Link Only)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Link text clearly identifies the purpose or destination of
                  links without requiring additional surrounding context.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#navigation-mechanisms-headings">
                    2.4.10 Section Headings
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Sections of content are identified using headings, allowing
                  users to understand the organization of the page and navigate
                  between sections.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#focus-not-obscured-enhanced">
                    2.4.12 Focus Not Obscured (Enhanced)
                  </a>{' '}(Level AAA 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  When a user interface component receives keyboard focus, it
                  remains fully visible and is not obstructed by author-created
                  content.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#focus-appearance">
                    2.4.13 Focus Appearance
                  </a>{' '}(Level AAA 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  Visible focus indicators are consistently presented and
                  provide sufficient size and contrast to help users identify
                  the currently focused interface component during keyboard
                  navigation.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#target-size">
                    2.5.5 Target Size
                  </a>{' '}(Level AAA 2.1 and 2.2)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>Targets in the product have a minimum height of 44px.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG21/#concurrent-input-mechanisms">
                    2.5.6 Concurrent Input Mechanisms
                  </a>{' '}(Level AAA 2.1 and 2.2)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product content does not restrict the use of available
                  input modalities on a platform, unless these restrictions are
                  needed to ensure content security or to adhere to user
                  preferences or settings.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#meaning-idioms">
                    3.1.3 Unusual Words
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product does not use definitions, words, or phrases in an
                  unusual or restricted manner, including idioms and jargon.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#meaning-located">
                    3.1.4 Abbreviations
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>The product does not contain abbreviations.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#meaning-supplements">
                    3.1.5 Reading Level
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product does not contain content requiring lower-secondary
                  reading level interpretation or supplemental reading
                  assistance under this criterion.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#meaning-pronunciation">
                    3.1.6 Pronunciation
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The product does not include words whose meaning is ambiguous
                  in context without knowing the pronunciation.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#consistent-behavior-no-extreme-changes-context">
                    3.2.5 Change on Request
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product does not initiate significant changes of context
                  unexpectedly and provides user control over interactions and
                  navigation changes where applicable.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#minimize-error-context-help">
                    3.3.5 Help
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Not Applicable</p>
              </td>
              <td>
                <p>
                  The content does not require context-sensitive help, and the
                  labels provided are sufficient to describe all functionality,
                  making additional assistance unnecessary.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="http://www.w3.org/TR/WCAG20/#minimize-error-reversible-all">
                    3.3.6 Error Prevention (All)
                  </a>{' '}(Level AAA)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  User-entered data is checked for input errors, and the user is
                  given the opportunity to correct them.
                </p>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <p>
                  <a href="https://www.w3.org/TR/WCAG22/#accessible-authentication-enhanced">
                    3.3.9 Accessible Authentication (Enhanced)
                  </a>{' '}(Level AAA 2.2 only)
                </p>
                <p>EN 301 549 Criteria – Does not apply</p>
                <p>Revised Section 508 – Does not apply</p>
              </th>
              <td>
                <p>Supports</p>
              </td>
              <td>
                <p>
                  The product supports accessible authentication methods without
                  requiring users to complete cognitive function tests such as
                  memorization, transcription, or object recognition tasks as
                  part of the authentication process.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </figure>
    </div>
  );
}
