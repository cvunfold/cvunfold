import type { Article } from "./article-types";

export const atsGuideEn: Pick<Article, "title" | "description" | "excerpt" | "readingTime" | "intro" | "openingParagraphs" | "sections" | "checklist"> = {
  "intro": "Start with two checks: can the file's text be read in a sensible order, and does your CV contain evidence for the job's requirements? Technology names make information easier to find. A description of your work explains what you did with them.",
  "openingParagraphs": [
    "Use the file you intend to submit. A high score from a CV checker does not tell you how a particular employer will assess your application."
  ],
  "sections": [
    {
      "heading": "Check the text in your PDF first",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Open the CV, select its text and paste it into a plain-text editor. If you cannot select any text, the document may have been saved as an image. Export it again from the original application rather than taking a screenshot."
        },
        {
          "type": "paragraph",
          "text": "Read the pasted text from top to bottom. Check whether each job title still sits with its employer, dates and bullets. Make sure contact details, skills and education are complete. Look for text from a sidebar interrupting an experience description."
        },
        {
          "type": "paragraph",
          "text": "If the pasted version mixes a job title, a skill, a date and an education entry, revisit the layout. A simple single-column version is a useful starting point. You can keep clear typography and spacing."
        },
        {
          "type": "paragraph",
          "text": "Copying text can reveal problems, but it does not reproduce every employer's parser. Different extraction tools can handle the same PDF differently."
        },
        {
          "type": "paragraph",
          "text": "Greenhouse lists columns, complex tables, images and important details in headers or footers among possible causes of incomplete parsing. That is guidance for one product, rather than proof that every ATS rejects every two-column CV. Greenhouse documentation."
        }
      ],
      "links": [
        {
          "label": "Greenhouse documentation",
          "href": "https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse"
        }
      ]
    },
    {
      "heading": "PDF or DOCX?",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Follow the instructions in the job advert or application form. When no format is specified, choose a file whose content and layout you can check before submitting it."
        },
        {
          "type": "paragraph",
          "text": "Inspect the PDF and copy its text. For DOCX, reopen the saved file and check page breaks, dates and contact details. The extension alone does not establish parsing quality."
        },
        {
          "type": "paragraph",
          "text": "When a form fills in fields from your upload, review them before submitting. Pay particular attention to employers, titles and dates. Greenhouse advises candidates to check and correct automatically parsed information. Candidate FAQ."
        }
      ],
      "links": [
        {
          "label": "Candidate FAQ",
          "href": "https://support.greenhouse.io/hc/en-us/articles/43418495049499-MyGreenhouse-FAQ-for-Candidates"
        }
      ]
    },
    {
      "heading": "Use headings that explain the contents",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "“Experience”, “Projects”, “Skills” and “Education” tell the reader what is inside each section. “My journey” requires interpretation before anyone reaches the entries."
        },
        {
          "type": "paragraph",
          "text": "This is an editing recommendation, not a compulsory vocabulary shared by all systems. Keep each role, employer, employment period and description together. Label a project as personal, coursework or commercial work so the reader can distinguish employment from a learning exercise."
        }
      ]
    },
    {
      "heading": "Tailor the evidence you already have",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Take the most important requirements from the advert and assign each one to a group:"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "The CV already shows it. Make the evidence easy to find.",
            "You have the experience, but the description hides it. Explain your contribution more precisely.",
            "You do not have that experience. Do not add the skill to your CV."
          ]
        },
        {
          "type": "paragraph",
          "text": "Suppose you have two genuine pieces of experience. This fictional example illustrates the editing decision:"
        },
        {
          "type": "paragraph",
          "text": "Implemented order-form validation in React and TypeScript. Added API error messages and tests for retrying a failed save."
        },
        {
          "type": "paragraph",
          "text": "Extended a shared date-picker component with keyboard navigation, focus restoration and examples of its states in Storybook."
        },
        {
          "type": "paragraph",
          "text": "For a role focused on forms and API integration, move the first bullet higher. For a component-library role, foreground the second. Keep the facts and change their order or emphasis."
        },
        {
          "type": "paragraph",
          "text": "Do not turn “tests for retrying a save” into “an organisation-wide quality strategy” unless that was your responsibility. You should be able to explain every tailored sentence in an interview."
        },
        {
          "type": "paragraph",
          "text": "If the role requires React and you used it, name it directly and connect it to your work. “React, React.js, ReactJS” adds repetition. A bullet containing the recognisable name and an action gives the reader useful information."
        }
      ]
    },
    {
      "heading": "What does an ATS-checker score mean?",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Look at what the tool measures. Extracting text, detecting sections and comparing terms against an advert are different tasks. Interpret the result against the stated criteria; do not transfer it automatically to another tool or an employer's system."
        },
        {
          "type": "paragraph",
          "text": "For each finding, ask which part of the document supports it and what you can change. “This role has no dates” points to an edit. “68% match” without an explanation does not yet identify an action."
        },
        {
          "type": "paragraph",
          "text": "Check the service's scope too. A readability test does not necessarily compare a CV with an advert or assess the experience descriptions. CVUnfold's free result includes an ATS readability check, a first impression and one improvement backed by a quote. Its analysis form does not collect a job advert for automatic comparison. Compare the requirements against your evidence yourself."
        }
      ]
    },
    {
      "heading": "Before you submit",
      "paragraphs": [],
      "blocks": [
        {
          "type": "paragraph",
          "text": "Check the final exported file and correct any application fields filled incorrectly. Then read the opening of your CV: does your strongest description answer an important requirement of the role?"
        },
        {
          "type": "paragraph",
          "text": "If the remaining issue is the content, read the guide to technical credibility or explore the sample report. You can also review your CV with CVUnfold and start with one finding tied to the document."
        }
      ],
      "links": [
        {
          "label": "technical credibility",
          "href": "/en/articles/technical-credibility-in-a-developer-cv"
        },
        {
          "label": "sample report",
          "href": "/en/sample-report"
        },
        {
          "label": "review your CV with CVUnfold",
          "href": "/en"
        }
      ]
    }
  ],
  "checklist": [],
  "title": "An ATS-friendly CV: check your PDF and tailor it to the role",
  "description": "Check PDF text order, review parsed fields and tailor genuine experience to a job description. A practical CV check with clear limits on ATS scores.",
  "excerpt": "Check PDF text, parsed fields and evidence for the role. Interpret checker results against their stated criteria.",
  "readingTime": "4 min"
};
