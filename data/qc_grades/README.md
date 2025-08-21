# Queens College Grade Distribution Data

This directory contains CSV files exported from the Queens College "Grade Distribution 2012–2024" Google Sheet.

## File Naming Convention

Name your CSV files using the following format:
- `SP25.csv` (Spring 2025)
- `FA24.csv` (Fall 2024)
- `SU24.csv` (Summer 2024)
- etc.

## Expected Column Headers

The ingestion script expects these columns (exact or close—it will normalize variations):

- `TERM` - Term/Semester identifier
- `SUBJECT` - Department/Subject code (e.g., "CSCI", "MATH")
- `NBR` - Course number (e.g., "111", "201")
- `COURSE NAME` - Full course name
- `SECTION` - Section number
- `PROF` - Professor name
- `TOTAL` - Total enrollment
- `A+` - Number of A+ grades
- `A` - Number of A grades
- `A-` - Number of A- grades
- `B+` - Number of B+ grades
- `B` - Number of B grades
- `B-` - Number of B- grades
- `C+` - Number of C+ grades
- `C` - Number of C grades
- `C-` - Number of C- grades
- `D` - Number of D grades
- `F` - Number of F grades
- `W` - Number of W (Withdraw) grades
- `INC/NA` - Number of Incomplete/Not Available grades
- `AVG GPA` - Average GPA for the section

## Missing Grade Columns

If a grade column is missing for a term, it will be treated as 0.

## Running the Ingestion

After adding your CSV files to this directory, run:

```bash
npm run ingest
```

This will load all CSV files into the SQLite database and normalize the column names.
