import test from "node:test";
import assert from "node:assert/strict";
import { findHardConflict, rankAnimals, scoreAnimal } from "../src/matching.js";

const profile = {
  species: "dog",
  homeType: "apartment",
  hasGarden: false,
  childrenAge: "none",
  hasDogs: false,
  hasCats: true,
  experienceLevel: "some",
  activityLevel: "medium",
  maxAloneHours: 4,
  preferredAge: "adult",
  preferredSize: "small",
  openToSpecialNeeds: false
};

const dog = {
  id: "dog-1",
  name: "Bran",
  status: "available",
  species: "dog",
  age_group: "adult",
  size: "small",
  activity_level: "medium",
  apartment_suitable: true,
  garden_required: false,
  good_with_children: true,
  good_with_dogs: true,
  good_with_cats: true,
  max_alone_hours: 5,
  experience_required: "first_time",
  special_needs: false
};

test("excludes an animal with an explicit household conflict", () => {
  const conflict = findHardConflict(profile, { ...dog, good_with_cats: false });
  assert.match(conflict, /unsuitable with cats/i);
});

test("excludes an animal whose alone-time capacity is too low", () => {
  const animal = { ...dog, max_alone_hours: 5 };
  const result = scoreAnimal({ ...profile, maxAloneHours: 6 }, animal);
  assert.equal(result.eligible, false);
  assert.match(result.conflict, /alone-time tolerance/i);
});

test("does not turn unknown evidence into a positive match", () => {
  const result = scoreAnimal(profile, { ...dog, max_alone_hours: null });
  assert.equal(result.eligible, false);
  assert.match(result.conflict, /unknown/i);
});

test("ranks eligible animals and limits the shortlist", () => {
  const ranked = rankAnimals(profile, [
    dog,
    { ...dog, id: "dog-2", name: "Rua", activity_level: "high" },
    { ...dog, id: "dog-3", name: "Finn", good_with_cats: false },
    { ...dog, id: "dog-4", name: "Nell", preferred_size: "large" }
  ], 2);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].animal.id, "dog-1");
  assert.ok(ranked.every(({ assessment }) => assessment.eligible));
});
