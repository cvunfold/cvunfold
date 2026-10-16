import type { Article } from "./article-types";

export const frontendCvEn: Article = {
  "intro": "A frontend developer CV should explain what you built, which part you owned and how you checked its behaviour. React and TypeScript belong in your skills section. A description of a form, integration or component shows how you used them.",
  "openingParagraphs": [
    "The example below is a complete CV followed by an explanation of its summary, technology list and experience bullets. Use it as a reference for editing your own document.",
    "Marta Zielińska, the employers, projects and all details in this example are fictional. This is an editorial illustration, not a customer CV or a hiring result. The example.com addresses stand in for your own working links. Use only statements that reflect your actual work."
  ],
  "sections": [
    {
      "heading": "Example frontend developer CV",
      "paragraphs": [],
      "blocks": [
        {
          "type": "heading",
          "text": "Marta Zielińska"
        },
        {
          "type": "paragraph",
          "text": "Frontend Developer · React and TypeScript"
        },
        {
          "type": "paragraph",
          "text": "Warsaw · marta.zielinska@example.com"
        },
        {
          "type": "paragraph",
          "text": "Portfolio: https://example.com/portfolio"
        },
        {
          "type": "paragraph",
          "text": "GitHub: https://example.com/github"
        },
        {
          "type": "heading",
          "text": "Summary"
        },
        {
          "type": "paragraph",
          "text": "Frontend developer with experience building React and TypeScript applications for order-management teams. Worked on forms, REST API integrations and shared components. In my latest role, I owned the order-editing interface: validation, save-error handling and tests for its main user journeys."
        },
        {
          "type": "heading",
          "text": "Skills"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Interfaces: React, TypeScript, JavaScript, HTML, CSS.",
            "Data: REST APIs, TanStack Query; loading, error and retry states.",
            "Testing: React Testing Library, Vitest, Playwright.",
            "Components: Storybook; documenting states and keyboard behaviour.",
            "Collaboration: Git, code review and agreeing API contracts with backend developers."
          ]
        },
        {
          "type": "heading",
          "text": "Experience"
        },
        {
          "type": "paragraph",
          "text": "Frontend Developer · Northleaf Tools"
        },
        {
          "type": "paragraph",
          "text": "March 2023 to September 2026 · order-management application"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Implemented order editing in React and TypeScript, including field validation and preservation of user input after a failed save.",
            "Agreed API error formats with backend developers. Distinguished field errors from request failures in the interface and added a save-retry action. Used TanStack Query to fetch and refresh order data.",
            "Extracted a shared date-picker component. Added keyboard navigation, focus restoration on close and examples of its states in Storybook.",
            "Wrote validation tests with Vitest and React Testing Library. Tested successful order saves, API errors and retries with Playwright.",
            "Reviewed loading, empty-data and error states in pull requests, providing reproduction steps for issues I found."
          ]
        },
        {
          "type": "paragraph",
          "text": "Junior Frontend Developer · Cedar Labs"
        },
        {
          "type": "paragraph",
          "text": "August 2021 to February 2023 · administration panel"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Built list and detail views in React. Connected filters and pagination to a REST API using the agreed data contract.",
            "Added separate no-results, loading and request-error views so users could understand the current state of an operation.",
            "Improved the user-invitation form by associating labels with fields and adding text error messages. Checked keyboard navigation through the form."
          ]
        },
        {
          "type": "heading",
          "text": "Personal project"
        },
        {
          "type": "paragraph",
          "text": "Session Notes · meeting-notes application"
        },
        {
          "type": "paragraph",
          "text": "React, TypeScript, local browser storage"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Designed note creation and editing, task completion and filtering by status.",
            "Added JSON export and import with validation of the imported structure. An invalid import does not replace saved notes.",
            "Documented setup, project scope and the limitations of local storage in the README. Repository: https://example.com/session-notes"
          ]
        },
        {
          "type": "heading",
          "text": "Education"
        },
        {
          "type": "paragraph",
          "text": "Engineering degree in Computer Science · fictional university · 2017 to 2021"
        },
        {
          "type": "heading",
          "text": "Languages"
        },
        {
          "type": "paragraph",
          "text": "Polish: native. English: B2; reading technical documentation and participating in code reviews."
        }
      ]
    },
    {
      "heading": "Why the summary mentions a form",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "The summary selects a specific part of Marta's experience and previews the evidence below. It identifies the role, working context and scope. The reader does not need to interpret “developing modern solutions”."
        },
        {
          "type": "paragraph",
          "text": "Do not copy the summary just because you use the same stack. If you mainly built content sites, describe that context. If you maintained a component library, explain its use and your contribution. The summary should follow from your experience."
        },
        {
          "type": "paragraph",
          "text": "For a forms-focused role, Marta could keep this opening. For a component-library role, she could foreground the date picker, Storybook and keyboard behaviour. Both versions would be supported by the same CV."
        }
      ]
    },
    {
      "heading": "Connect your stack to the work",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "A skills list lets someone find your tools quickly. It does not establish how well you know them. In the example, React, testing and Storybook also appear in descriptions of their practical use."
        },
        {
          "type": "paragraph",
          "text": "Group tools by task if that makes the list easier to read. You do not have to use these exact categories. For a Next.js developer, rendering, routing and data fetching may deserve space when they are part of the work you can explain."
        },
        {
          "type": "paragraph",
          "text": "There are no stars or proficiency percentages here. That is an editorial choice: a description of using a tool is easier to discuss than “TypeScript 90%”. The guide to technical credibility develops this connection between skills and evidence."
        }
      ],
      "links": [
        {
          "label": "technical credibility",
          "href": "/en/articles/technical-credibility-in-a-developer-cv"
        }
      ]
    },
    {
      "heading": "Explain your part of the project",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Compare two descriptions based on the fictional CV:"
        },
        {
          "type": "paragraph",
          "text": "Before: “Developed a React application. Integrated APIs. Maintained code quality.”"
        },
        {
          "type": "paragraph",
          "text": "After: “Implemented order editing in React and TypeScript. Added field validation and preserved user input after failed saves. Wrote tests for successful saves, API failures and retries.”"
        },
        {
          "type": "paragraph",
          "text": "The revised version names the feature, its error behaviour and how it was checked. It also creates questions for an interview: why preserve the input, how were errors distinguished and what did the tests cover?"
        },
        {
          "type": "paragraph",
          "text": "There is no invented percentage improvement or user count. Missing measurements do not justify making up a result. If you measured a performance change, include the result and comparison conditions: the view, type of test and measurement method. Do not present a local test as production-traffic evidence."
        },
        {
          "type": "paragraph",
          "text": "Every bullet need not be an elaborate achievement. The code-review bullet describes a responsibility and its scope. If several bullets say only that you collaborated, keep the useful ones and use the space for a concrete action."
        }
      ]
    },
    {
      "heading": "If you are applying for your first job",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Do not borrow the example's employment history. Describe coursework, university or personal projects and label their origins. Show a feature, your contribution and how you checked it."
        },
        {
          "type": "paragraph",
          "text": "For example: “Course project: a React task dashboard. After the course, I added JSON import and data validation. Invalid files trigger an error and leave the existing task list unchanged.”"
        },
        {
          "type": "paragraph",
          "text": "This is a smaller scope than owning a commercial product, but it gives the reader specific information. Expand it only with work you actually did. The guide to a tech CV with no work experience includes more examples."
        }
      ],
      "links": [
        {
          "label": "a tech CV with no work experience",
          "href": "/en/articles/tech-cv-with-no-experience"
        }
      ]
    },
    {
      "heading": "Check the exported file",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Read the version you will submit. Check that dates belong to the right roles, links lead to the selected projects and copied text follows a logical order. Do not squeeze everything onto one page at the expense of useful descriptions. Decide on length according to what each section contributes to the application."
        },
        {
          "type": "paragraph",
          "text": "Take one description from your CV and ask: is the action, scope and verification clear? You can compare it with the CVUnfold sample report or review your own CV. The free result gives you one improvement backed by a quote to start editing from."
        }
      ],
      "links": [
        {
          "label": "CVUnfold sample report",
          "href": "/en/sample-report"
        },
        {
          "label": "review your own CV",
          "href": "/en"
        }
      ]
    }
  ],
  "checklist": [],
  "slug": "frontend-developer-cv-example",
  "category": "Developer CV",
  "publicationStatus": "draft",
  "title": "Frontend developer CV: example and project descriptions",
  "description": "Read a fictional frontend developer CV with notes on the summary, skills and project descriptions. Specific examples without invented achievements.",
  "excerpt": "A complete fictional CV, from the summary to skills and experience. Learn how to select information and show your contribution.",
  "readingTime": "6 min"
};
