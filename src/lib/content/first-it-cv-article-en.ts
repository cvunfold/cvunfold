import type { Article } from "./articles";
import { firstItCvArticle } from "./first-it-cv-article";

export const firstItCvArticleEn: Article = {
  slug: "tech-cv-with-no-experience",
  category: "Your first job in tech",
  title: "A tech CV with no experience: how to improve your chances",
  description: "You can strengthen your tech CV with course projects, university work and your own apps. See practical before-and-after examples without inventing experience.",
  excerpt: "You can improve your CV before landing your first job in tech. Learn how to describe projects, your contribution and skills you have put into practice.",
  readingTime: "6 min",
  publishedAt: firstItCvArticle.publishedAt,
  intro: "Having no professional experience in tech does not mean you have nothing to put on your CV. A course project, an app you built or a university group assignment can demonstrate skills relevant to your first role. You already have material to work with, and you can improve how you present it before you land that first job.",
  openingParagraphs: [
    "You do not need to present yourself as an experienced developer. At this stage, describe what you have actually done: working features, your contribution and how you checked that the application worked. A clearer description can strengthen your CV and give you something concrete to discuss in an interview. It cannot guarantee a job, but it is a step you can take now.",
    "Often, the useful details are already in the project. They just have not made it onto the page. ‘A React app’ tells the reader very little. A form that handles invalid input, saves changes and displays an error when a request fails gives you much more to describe. You can start improving that CV entry with the project you already have.",
    "The examples below are illustrative. Each ‘after’ version assumes the features, tests and actions described actually happened. Leave out anything you did not do. Improving your CV should not require inventing a project history."
  ],
  cover: {
    ...firstItCvArticle.cover!,
    alt: "An illustration of a laptop displaying a project, project cards and a CV on a light desk."
  },
  sections: [
    {
      heading: "Start with what works",
      paragraphs: [
        "Give the project a name, explain its purpose and list the technologies you used. Then choose a few details that show your work. You do not need to copy the entire feature list from the README into your CV."
      ],
      example: {
        before: "Task management app. React, TypeScript, REST API.",
        after: "Personal project: a task management app built with React and TypeScript. Implemented task creation, editing and filtering by status. Connected the forms to a REST API and added error handling for failed saves.",
        note: "Illustrative example. Include only work you actually did.",
        beforeLabel: "Before",
        afterLabel: "After"
      },
      paragraphsAfterExample: [
        "The second version explains what sits behind the app's name. It also opens up a useful conversation: what does the user see when a save fails? Does the form keep their input? How do you refresh the list after saving?",
        "Choose details that matter for the role you want. For a frontend application, give more space to forms, interactions and data handling. For your first backend role, focus on the API, validation and database operations. The same project can support both versions, provided you actually worked on those parts."
      ]
    },
    {
      heading: "A course project belongs on your CV too",
      paragraphs: [
        "Say that the app was built during a course or bootcamp. If you developed it further afterwards, make your own additions clear."
      ],
      example: {
        before: "Independently built an e-commerce platform with a shopping basket and payments.",
        after: "Course project: an online shop with a shopping basket and a payment integration in test mode. After the course, independently added basket persistence between visits and tests for basket total calculations.",
        note: "Illustrative example. Include only work you actually did.",
        beforeLabel: "Before",
        afterLabel: "After"
      },
      paragraphsAfterExample: [
        "This version separates the course exercise from the work you did afterwards. ‘Test mode’ also makes the scope of the payment integration clear. You are not implying that the app processed real transactions.",
        "If you followed a tutorial without making your own changes, describe it as a tutorial-based project. You can explain the features you practised building. Do not claim that you independently designed the whole solution.",
        "A certificate confirms that you completed a course. The project description gives you room to explain what you can do after completing it."
      ]
    },
    {
      heading: "Make your contribution to a group project clear",
      paragraphs: [
        "‘Worked in a team’ does not explain what you did. Describe your part and how it connected with the work of the other people involved."
      ],
      example: {
        before: "Built an appointment booking app in a team of four.",
        after: "Bootcamp team project: an appointment booking app. Built the available appointment view and booking form. Agreed the data format and error responses for unavailable slots with the teammate developing the API.",
        note: "Illustrative example. Include only work you actually did.",
        beforeLabel: "Before",
        afterLabel: "After"
      },
      paragraphsAfterExample: [
        "You do not need to list every contributor or describe every meeting. Give the reader enough information to distinguish your work from the team's overall result. If you also helped with another part, you can mention it while keeping the scope of that contribution clear."
      ]
    },
    {
      heading: "You can describe results without having users",
      paragraphs: [
        "A learning project may have no revenue, conversion data or customer feedback. You can still describe a completed feature and how you checked it."
      ],
      example: {
        before: "Improved application quality and performance.",
        after: "Added registration form validation tests for empty fields, invalid email addresses and passwords below the minimum length. Updated error messages to identify the field that needed correcting.",
        note: "Illustrative example. Include only work you actually did.",
        beforeLabel: "Before",
        afterLabel: "After"
      },
      paragraphsAfterExample: [
        "There is no percentage here. There is specific work you can explain.",
        "If you measured something, include the result and the conditions of the measurement. A test using local data does not demonstrate how the application behaves under heavy traffic. If you did not measure an improvement, stick to what you changed and checked.",
        "The same care applies to deploying a project. A working demo lets someone try the app. That alone does not establish experience maintaining a system for customers."
      ]
    },
    {
      heading: "Tutorials and AI: be ready to explain the code",
      paragraphs: [
        "Getting help while learning does not invalidate a project. Keep your description within the scope of what you understand and can explain.",
        "I would not turn every CV bullet into a list of AI assistants used. But if an entire module came from generated code, do not present its architecture as your own design decision if you cannot explain the reasoning. Think about what you did with the suggested solution: did you check it, find a bug, change the data handling or add a test?",
        "Before adding a feature to your CV, walk through how it works. Explain where the data comes from, where it goes and what happens when something fails. If you cannot answer yet, return to the code. You have found a specific gap you can work on before an interview."
      ]
    },
    {
      heading: "Make your work easy to explore",
      paragraphs: [
        "Include a repository link for the project you choose, and a demo link if you have one. Check both in a browser window where you are not signed in. The repository should include setup instructions and a short explanation of your contribution. Someone should be able to try the demo without your help.",
        "Choose projects where you can say something specific about your own work. One well-described project can be a better choice than several entries that differ only in the name of the course.",
        "Pick one project description now. Can the reader tell what you personally did, what works and how you checked it? Add the missing details. If you use CVUnfold to review your CV, select ‘First job in tech’ so the review takes this stage of your career into account."
      ]
    }
  ],
  checklist: []
};
