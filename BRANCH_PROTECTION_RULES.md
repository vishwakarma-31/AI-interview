# Branch Protection Rules

This document describes how to set up branch protection rules for the AI Interview Assistant project on GitHub.

## Overview

Branch protection rules are used to enforce certain workflows for branches, such as requiring pull request reviews or status checks before merging. For this project, we recommend setting up protection rules for the `main` and `develop` branches.

## Setting Up Branch Protection Rules

### Prerequisites

- You must have administrative access to the GitHub repository
- The repository should be hosted on GitHub (not GitHub Enterprise Server unless configured)

### Steps to Configure Branch Protection Rules

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click on the "Settings" tab

2. **Access Branch Protection Settings**
   - In the left sidebar, click on "Branches"
   - Under "Branch protection rules", click "Add rule"

3. **Configure Protection for `main` Branch**
   - In the "Branch name pattern" field, enter `main`
   - Enable the following options:
     - **Require pull request reviews before merging**
       - Check "Required approving reviews" and set to 1
       - Check "Dismiss stale pull request approvals when new commits are pushed"
     - **Require status checks to pass before merging**
       - Check "Require branches to be up to date before merging"
     - **Include administrators**
       - Check this box to apply rules to administrators as well
   - Click "Create" to save the rule

4. **Configure Protection for `develop` Branch**
   - Click "Add rule" again
   - In the "Branch name pattern" field, enter `develop`
   - Enable the following options:
     - **Require pull request reviews before merging**
       - Check "Required approving reviews" and set to 1
       - Check "Dismiss stale pull request approvals when new commits are pushed"
     - **Require status checks to pass before merging**
       - Check "Require branches to be up to date before merging"
     - **Include administrators**
       - Check this box to apply rules to administrators as well
   - Click "Create" to save the rule

## Recommended Branch Protection Settings

### For `main` Branch:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators
- ✅ Allow force pushes (unchecked)
- ✅ Allow deletions (unchecked)

### For `develop` Branch:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators
- ✅ Allow force pushes (unchecked)
- ✅ Allow deletions (unchecked)

## Status Checks to Require

The following status checks should be required before merging:

1. **Continuous Integration**
   - `ci/circleci: build` (if using CircleCI)
   - `continuous-integration/travis-ci` (if using Travis CI)
   - Or your specific CI pipeline name

2. **Code Quality**
   - `codeclimate` (if using CodeClimate)
   - `sonarcloud` (if using SonarCloud)

3. **Security Scans**
   - `snyk` (if using Snyk)
   - `dependency-review` (GitHub native dependency review)

## Additional Recommendations

1. **Linear History**
   - Consider enabling "Require linear history" to prevent merge commits

2. **Branch Restrictions**
   - You can restrict who can push to protected branches by adding specific actors or teams

3. **Lock Branch**
   - Consider enabling "Lock branch" to prevent pushes that bypass required status checks

## Enforcing Rules

Once branch protection rules are set up, GitHub will automatically enforce them:

- Users (including administrators if "Include administrators" is checked) cannot push directly to protected branches
- Pull requests targeting protected branches must meet all requirements before merging
- Required status checks must pass before merging is allowed
- Required reviews must be approved before merging

## Troubleshooting

### Common Issues

1. **Unable to Merge Pull Requests**
   - Ensure all required status checks have passed
   - Verify that the required number of reviewers have approved the PR
   - Check that the branch is up to date with the base branch

2. **Status Checks Not Appearing**
   - Verify that your CI/CD workflows are properly configured
   - Check that the workflow files are in the `.github/workflows/` directory
   - Ensure workflows are triggered on `push` and `pull_request` events

3. **Permission Issues**
   - Confirm that users have the appropriate repository permissions
   - Verify that team access is properly configured

## Conclusion

Setting up branch protection rules is crucial for maintaining code quality and preventing accidental changes to critical branches. By following these guidelines, you'll ensure that all changes to `main` and `develop` go through proper review processes and pass all required checks.