# Refined Prompts — WeatherApplication

A cleaned-up, reusable rendering of the prompts that built this project. Each
entry keeps the same intent as the raw log in [PROMPTS.md](PROMPTS.md), rewritten
as a clear, self-contained prompt. Numbers match the verbatim log. (Some prompts
describe features — multi-language i18n, the 7-day outlook — that were later
removed; they are kept here as an accurate record of what was asked at the time.)

## Build session

1. Keep as much logic as possible in the .NET backend, cleanly separated from the frontend.
2. Add each country's currency symbol and its live exchange rate, following the existing data structure, and update the affected files.
3. Give me the commands to run the Angular frontend.
4. Stop the running dev servers.
5. Apply the `frontend-design` skill (github.com/anthropics/skills) and follow its generated instructions for the UI.
6. Rework the world-map feature and add test cases for both the frontend and backend.
7. Run the application (backend + frontend).
8. What are the exact commands to run the frontend and the backend?
9. Show five station cards per row, over a weather-themed background.
10. Add "Established Year" as a sortable "Year" column; rename every "WebApplication" to "WeatherApplication" across files, folders, and code; replace the globe with an interactive world-map background that pans to the hovered country's region (e.g. hovering India moves the map to India); show each capital's time zone (IST/GST style); keep every card the same size and format; make the layout responsive (apply the `sleek-design-mobile-apps` skill); and include India's union territories. Use your judgment on backend decisions and ask when unsure.
11. Auto-detect the user's locale from their location and localize the UI accordingly, with a translation fallback when the local language isn't understood; add frontend and backend tests; continue renaming "WebApplication" → "WeatherApplication" throughout; and work one task at a time, easiest first.
12. Draw each country's borders on the map, filling the hovered country with colours drawn from its flag.
13. Revert the last change and summarise what it had changed.
14. Produce a delivery plan: estimated hours, team size, task/sprint breakdown (Scrum), Jira ticket count, AWS services and monthly cost, prompts used, and a go-live plan — traditional vs AI-assisted — plus the architecture and skills used. Present it step-by-step in Markdown, and mind RAM usage while building.
15. Yes, proceed.
16. Do both options.
17. Yes — add a `terraform.tfvars` example and a secrets checklist.
18. When I hover a country, some sit off-screen — rotate/pan the map so the hovered country is always within the visible area.
19. Continue from where you left off.
20. Create the AWS architecture, and rename the project folder from "WebApplication" to "WeatherApplication".
21. Yes — add the deployment steps to DEPLOY.md.
22. Stop all running servers/processes.
23. List all the prompts I've used so far.
24. Yes — save that prompt list to a file.

**Menu selections (not typed):** languages = global set (en, hi, es, fr, ar, zh, ja); territories = India union territories + world territories; time-zone display = abbreviation + offset (e.g. "IST · UTC+5:30"); Open-Meteo = .NET proxy + browser fallback; last-step change = revert per-country borders + flag-colour fill.

## Follow-up session — restructure, docs, Jira & git workflow

25. Run the application.
26. Extract the frontend and backend dependencies, run the app, and fix any errors yourself; then create two architecture docs — one vendor-neutral (no AWS) and one AWS-based.
27. Read every file and restructure the repo — frontend files into `frontend/`, backend into `backend/`, cloud/deployment files into `cloud/` (creating folders as needed); fix any paths so the code still runs; and make the README focus on the project description, skills, and languages.
28. Merge it into `main` and re-launch the app end-to-end from the new structure to confirm the full stack still runs.
29. Stop the servers, delete the merged feature branch, and remove the scroll-to-load icon.
30. Replace the "FIND" text with a search (magnifier) icon.
31. Make the 7-day outlook start on Wednesday, and hide the navigation/location marker on the map.
32. Run the application.
33. Add the missing frontend and backend test cases.
34. Rename the title to "World Weather" and add a weather logo beside it.
35. Go ahead.
36. Clean up the docs and remove dead CSS.
37. Move the outlook to the top-right and adjust the layout to use the remaining space.
38. Revert the last change.
39. Verify everything — project structure, tests, and the rest — then stop the servers.
40. Stop.
41. Review every file and bring anything stale or missing up to date.
42. Update those two docs too; remove the outlook feature and its section from the frontend and backend, including the related test cases; and remove the word "[redacted]" everywhere you find it.
43. Analyse the project structure and give a sprint-by-sprint breakdown — epics, stories, and ticket counts — in an importable Jira format.
44. Go ahead.
45. Create Jira tickets for the delivered work and mirror them with a git feature-branch structure, as a real project would be organised.
46. For this session, automatically append every prompt I type to the prompts file.
47. Yes — backfill the earlier prompts that weren't logged.
48. Give me end-to-end cost-optimization strategies for building and running this project.
49. Add a Mermaid cost-flow / decision diagram to the cost doc.
50. Commit everything and push it to a remote.
51. Create a repository named "WeatherApplication" under github.com/Mohan91002 and push everything to it.
52. Make the repository public.
53. In both local and remote, remove the word "[redacted]" and the ".[redacted]" folder — provided it doesn't break anything.
54. Redact the two PROMPTS.md lines that still contain the word.
55. I made some local changes — push them to the remote.
56. Keeping it in the repo root is fine — now run the app.
57. Stop the servers, and stop auto-appending prompts to the prompts file.
58. Here is the failing GitHub Actions run (deploy failed: `aws-region` not supplied, plus Node 20 deprecation warnings) — address it.
59. Yes — bump the deprecated GitHub Action versions.
60. Apply those changes to local and remote as well, including the feature branches.
61. Update the prompts file with the prompts that weren't logged, in local and remote.

**Menu selections (not typed):** Jira ticket creation = CSV import; git feature-branch structure = all 27 story branches.
