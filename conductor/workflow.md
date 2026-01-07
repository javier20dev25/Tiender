# Project Workflow: Tiender (MVP)

## 1. Philosophy

This project follows a lean MVP philosophy. Our priorities are:

-   **Speed over Ceremony:** We will always choose the path that allows for faster iteration and delivery.
-   **Validation over Perfection:** The primary goal is to validate the core business ideas (user engagement, subscriptions) quickly, not to build a perfectly architected system from day one.

## 2. Work Cycle

The development process is simple and feature-driven:

1.  **Define Feature:** A clear goal is defined in a track's `plan.md`.
2.  **Implement End-to-End:** Develop the full feature slice.
3.  **Quick Manual Test:** Perform a brief manual verification to ensure the feature works as expected.
4.  **Commit per Feature:** Commit the completed feature with a descriptive message following the Conventional Commits standard.
5.  **Automatic Deploy:** Push the feature branch to `main`.

## 3. Testing Strategy

-   **Focus:** Tests will only be written for **critical business logic**.
-   **Target Coverage:** The indicative target for code coverage is **30-40%**.
-   **Exclusions:** No UI tests will be written for the MVP.

## 4. Deployment

-   **Trigger:** Deployment is triggered automatically on a push to the `main` branch.
-   **Platform:** **Vercel** handles the entire build and deploy process.
-   **Verification:** After deployment, manually verify that the critical paths of the application are functional.