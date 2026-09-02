name: Bug Report
description: Report an issue or bug in this repository
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: Thank you for helping improve this project!
  - type: textarea
    id: bug-description
    attributes:
      label: Bug Description
      description: Detailed summary of what went wrong.
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
    validations:
      required: true
