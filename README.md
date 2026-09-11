# Emerald SkillSwap

Build a full-featured SkillSwap web application combining the multi-user authentication and chain detection from chain-connect-login-main with all the complete features present in main_file.html, while strictly preserving the original green/emerald color scheme from chain-connect-login-main (oklch 0.6 0.13 133 / emerald-forest green tones) instead of the violet/blue gradient in the HTML prototype.

Core features to include from main_file.html:
1. Multi-PC Supabase Authentication: Sign up, sign in, session persistence, and user profile creation.
2. Dashboard: Overview with stats (matches found, active chains, trade hours, community rank), quick actions, and recent activity.
3. My Skills & Profile: Manage skills you teach and skills you want to learn, proficiency levels, and profile details.
4. Learning Goals: Target skills to acquire, priority ranking, and target deadlines.
5. Direct Matches: 1-to-1 reciprocal skill swap matching between community members.
6. Multi-Party Skill Chains: Graph cycle detection that identifies closed loops (A -> B -> C -> A) across different logged-in members with circular SVG visualization and link cards.
7. AI Skill Gap Analyzer: Evaluates current skills against desired career/learning targets and identifies gaps.
8. AI Mentor: Conversational chat assistant offering advice on skill roadmaps and finding matching partners.
9. Community Discover: Filterable directory of all members, what they teach, and what they want to learn.
10. Messages: In-app direct messaging interface between trade partners.
11. Collaborative Projects: Team-based projects matching complementary skill sets.
12. Reputation & Skill Score: Badges, trust rating, and trade reviews.

Design requirements:
- Maintain clean responsive navigation (sidebar/header) to switch smoothly between all views.
- Use the original green color palette from chain-connect-login-main (emerald/forest green accents, badges, buttons, active states, and borders).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/da2de28d-94d0-4ef9-b4f2-ea0e4a1d93da).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
