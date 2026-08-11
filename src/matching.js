const activityRank = { low: 0, medium: 1, high: 2 };
const experienceRank = { first_time: 0, some: 1, experienced: 2 };

const weights = Object.freeze({
  home: 20,
  activity: 20,
  aloneTime: 15,
  experience: 15,
  age: 10,
  size: 10,
  specialNeeds: 10
});

function known(value) {
  return value !== null && value !== undefined && value !== "unknown";
}

export function findHardConflict(profile, animal) {
  if (animal.status !== "available") return "Animal is not currently available";
  if (profile.species !== "either" && animal.species !== profile.species) {
    return "Species does not match";
  }
  if (profile.childrenAge !== "none" && animal.good_with_children === false) {
    return "Recorded as unsuitable for a household with children";
  }
  if (profile.hasDogs && animal.good_with_dogs === false) {
    return "Recorded as unsuitable with dogs";
  }
  if (profile.hasCats && animal.good_with_cats === false) {
    return "Recorded as unsuitable with cats";
  }
  if (!profile.hasGarden && animal.garden_required === true) {
    return "Requires a secure private garden";
  }
  if (!profile.openToSpecialNeeds && animal.special_needs === true) {
    return "Has ongoing needs outside the adopter's stated capacity";
  }
  return null;
}

function addCriterion(result, name, weight, outcome, evidence) {
  if (outcome === null) {
    result.unknown.push(name);
    result.possible += weight;
    return;
  }
  const awarded = outcome ? weight : 0;
  result.awarded += awarded;
  result.possible += weight;
  (outcome ? result.strengths : result.concerns).push(evidence);
}

export function scoreAnimal(profile, animal) {
  const conflict = findHardConflict(profile, animal);
  if (conflict) return { eligible: false, conflict, animalId: animal.id };

  const result = {
    eligible: true,
    animalId: animal.id,
    awarded: 0,
    possible: 0,
    strengths: [],
    concerns: [],
    unknown: []
  };

  const homeKnown = known(animal.apartment_suitable);
  const homeMatch = profile.homeType === "house" ||
    (homeKnown ? animal.apartment_suitable : null);
  addCriterion(result, "home suitability", weights.home, homeMatch,
    homeMatch ? "Home type is compatible" : "Home suitability does not match");

  const animalActivity = activityRank[animal.activity_level];
  const adopterActivity = activityRank[profile.activityLevel];
  const activityMatch = known(animalActivity)
    ? Math.abs(animalActivity - adopterActivity) <= 1
    : null;
  addCriterion(result, "activity level", weights.activity, activityMatch,
    activityMatch ? "Activity needs fit the adopter's routine" : "Activity needs may not fit the routine");

  const aloneMatch = known(animal.max_alone_hours)
    ? profile.maxAloneHours <= animal.max_alone_hours
    : null;
  addCriterion(result, "alone time", weights.aloneTime, aloneMatch,
    aloneMatch ? "Recorded alone-time tolerance fits" : "May be left alone longer than recorded tolerance");

  const requiredExperience = experienceRank[animal.experience_required];
  const adopterExperience = experienceRank[profile.experienceLevel];
  const experienceMatch = known(requiredExperience)
    ? adopterExperience >= requiredExperience
    : null;
  addCriterion(result, "experience", weights.experience, experienceMatch,
    experienceMatch ? "Experience level meets the recorded need" : "May require more experience");

  const ageMatch = profile.preferredAge === "any" ||
    (known(animal.age_group) ? profile.preferredAge === animal.age_group : null);
  addCriterion(result, "age preference", weights.age, ageMatch,
    ageMatch ? "Matches the age preference" : "Does not match the preferred age");

  const sizeMatch = profile.preferredSize === "any" ||
    (known(animal.size) ? profile.preferredSize === animal.size : null);
  addCriterion(result, "size preference", weights.size, sizeMatch,
    sizeMatch ? "Matches the size preference" : "Does not match the preferred size");

  const specialNeedsMatch = known(animal.special_needs)
    ? (!animal.special_needs || profile.openToSpecialNeeds)
    : null;
  addCriterion(result, "special needs", weights.specialNeeds, specialNeedsMatch,
    specialNeedsMatch ? "Care needs fit the stated capacity" : "Care needs require discussion");

  result.score = result.possible === 0
    ? 0
    : Math.round((result.awarded / result.possible) * 100);
  delete result.awarded;
  delete result.possible;
  return result;
}

export function rankAnimals(profile, animals, limit = 3) {
  return animals
    .map((animal) => ({ animal, assessment: scoreAnimal(profile, animal) }))
    .filter(({ assessment }) => assessment.eligible)
    .sort((a, b) => b.assessment.score - a.assessment.score ||
      a.animal.name.localeCompare(b.animal.name))
    .slice(0, limit);
}

export { weights };
