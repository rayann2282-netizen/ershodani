# Imam Course Planner

## Problem
Twice a year before course registration opens, Imam University students struggle to figure out which courses they can take next and what GPA they need to hit their academic goals. Today, they have to manually dig through the university website, check prerequisites, and calculate their GPA by hand, which often leads to confusion, frustration, and giving up.

## User
A 20-year-old male student in Level 4 at Imam University, lying in his room at night using his smartphone two days before course registration opens.

## Goal
Help students instantly see their eligible courses for the upcoming semester and their required target GPA without manual guesswork. We will know it worked if fewer students visit academic advising just to ask for their semester plan during the first week after launch.

## User stories
* As a student, I want to mark the courses I have already passed, so that the system knows my current academic progress. **[Must]**
* As a student, I want to see a clear list of courses I am eligible to take next semester based on completed prerequisites, so that I don't pick a course I am blocked from registering for. **[Must]**
* As a student, I want to enter my current GPA, completed hours, and target GPA, so that I can see what semester GPA I need to achieve my goal. **[Must]**
* As a student, I want to pick a preferred credit-hour load (light, medium, heavy), so that the suggested courses match my capacity. **[Should]**
* As a student, I want to save or share my planned course list as an image or text, so that I can reference it quickly when registration opens. **[Could]**

## MVP scope
To fit a 4-day build for a solo beginner, the MVP is strictly limited to the **3 Must stories** for **one single major's study plan**:
1. Checklist of the major's courses where the student marks what they passed.
2. Automatic list of unlocked courses for next semester (filtered by prerequisites).
3. Simple target GPA calculator.

*(Scope cut: Supporting multiple majors or uploading official transcripts will break the 4-day timeline. Start with one hardcoded study plan and manual course selection.)*

## Out of scope
* Section details (CRNs, class times, instructors, room numbers).
* Schedule conflict detection.
* Direct integration or login with the university portal.
* Official transcript PDF parsing.
* Support for multiple majors or colleges.
* Live chat with academic advisors.

## Key screens
1. **Completed Courses Screen:** A simple checklist of the study plan grouped by level where the student taps the courses they already passed.
2. **Next Semester Plan Screen:** A clean list of eligible courses unlocked for the upcoming semester, showing credit hours for each.
3. **Target GPA Screen:** A quick form taking current GPA, completed hours, planned hours, and target GPA to display the required semester GPA.

## Data it remembers
* The study plan for the pilot major (course codes, names, credit hours, and prerequisite rules).
* The list of courses the student marked as completed.
* The student's entered GPA inputs (current GPA, completed hours, target GPA).

## Open questions
* Which specific major's study plan will be used for the 4-day pilot, and is the prerequisite data 100% up to date?
* How will we measure the baseline number of students visiting advising to confirm if visits actually dropped?
* Are there special university rules (like maximum/minimum credit hours based on GPA) that must be reflected in the eligible courses list?