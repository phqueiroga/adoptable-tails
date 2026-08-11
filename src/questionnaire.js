export const questionnaire = [
  {
    id: "species",
    label: "Which type of companion are you considering?",
    type: "single",
    required: true,
    options: ["dog", "cat", "either"]
  },
  {
    id: "homeType",
    label: "What type of home do you live in?",
    type: "single",
    required: true,
    options: ["apartment", "house"]
  },
  {
    id: "hasGarden",
    label: "Do you have access to a secure private garden?",
    type: "boolean",
    required: true
  },
  {
    id: "childrenAge",
    label: "Are there children in the household?",
    type: "single",
    required: true,
    options: ["none", "under_8", "8_to_12", "over_12"]
  },
  {
    id: "hasDogs",
    label: "Do dogs currently live in the household?",
    type: "boolean",
    required: true
  },
  {
    id: "hasCats",
    label: "Do cats currently live in the household?",
    type: "boolean",
    required: true
  },
  {
    id: "experienceLevel",
    label: "How much pet-care experience do you have?",
    type: "single",
    required: true,
    options: ["first_time", "some", "experienced"]
  },
  {
    id: "activityLevel",
    label: "What activity level fits your routine?",
    type: "single",
    required: true,
    options: ["low", "medium", "high"]
  },
  {
    id: "maxAloneHours",
    label: "On a typical day, what is the longest the pet may be alone?",
    type: "number",
    required: true,
    min: 0,
    max: 10
  },
  {
    id: "preferredAge",
    label: "Do you have an age preference?",
    type: "single",
    required: true,
    options: ["baby", "young", "adult", "senior", "any"]
  },
  {
    id: "preferredSize",
    label: "Do you have a size preference?",
    type: "single",
    required: true,
    options: ["small", "medium", "large", "any"]
  },
  {
    id: "openToSpecialNeeds",
    label: "Are you open to an animal with ongoing medical or behavioural needs?",
    type: "boolean",
    required: true
  }
];
