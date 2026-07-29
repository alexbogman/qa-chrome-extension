type Sex = "male" | "female";

const MALE_FIRST_NAMES = [
  "James",
  "John",
  "Robert",
  "Michael",
  "William",
  "David",
  "Joseph",
  "Daniel",
  "Matthew",
  "Anthony",
  "Christopher",
  "Andrew",
  "Joshua",
  "Ryan",
  "Nicholas",
  "Kevin",
  "Brian",
  "Jason",
  "Justin",
  "Brandon",
  "Eric",
  "Jacob",
  "Tyler",
  "Aaron",
  "Adam",
  "Benjamin",
  "Samuel",
  "Alexander",
  "Patrick",
  "Nathan",
  "Ethan",
  "Jonathan",
  "Noah",
  "Liam",
  "Lucas",
  "Mason",
  "Logan",
  "Oliver",
  "Henry",
  "Sebastian",
  "Gabriel",
  "Dylan",
  "Caleb",
  "Isaiah",
  "Adrian",
  "Carlos",
  "Diego",
  "Marco",
  "Andre",
  "Marcus",
];

const FEMALE_FIRST_NAMES = [
  "Mary",
  "Patricia",
  "Jennifer",
  "Linda",
  "Elizabeth",
  "Barbara",
  "Susan",
  "Jessica",
  "Sarah",
  "Karen",
  "Emily",
  "Ashley",
  "Amanda",
  "Melissa",
  "Michelle",
  "Laura",
  "Stephanie",
  "Rebecca",
  "Nicole",
  "Samantha",
  "Angela",
  "Rachel",
  "Hannah",
  "Olivia",
  "Emma",
  "Sophia",
  "Isabella",
  "Mia",
  "Charlotte",
  "Amelia",
  "Harper",
  "Evelyn",
  "Abigail",
  "Ella",
  "Avery",
  "Scarlett",
  "Grace",
  "Chloe",
  "Victoria",
  "Natalie",
  "Brooklyn",
  "Zoe",
  "Lily",
  "Camila",
  "Valeria",
  "Sofia",
  "Elena",
  "Lucia",
  "Priya",
  "Aisha",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Patel",
  "Kim",
  "Chen",
  "Murphy",
  "Cook",
  "Rogers",
  "Morgan",
  "Cooper",
  "Reed",
  "Bailey",
];

const STREET_NAMES = [
  "Main St",
  "Oak Ave",
  "Maple Dr",
  "Cedar Ln",
  "Pine Rd",
  "Elm St",
  "Washington Blvd",
  "Lake View Dr",
  "Park Ave",
  "Broadway",
  "Chestnut St",
  "Walnut St",
  "Highland Ave",
  "Sunset Blvd",
  "River Rd",
  "Forest Dr",
  "Meadow Ln",
  "Willow Way",
  "Cherry St",
  "Birch Ct",
  "Spruce St",
  "Hickory Ln",
  "Magnolia Ave",
  "Peachtree Rd",
  "Liberty St",
  "Jefferson Ave",
  "Lincoln Dr",
  "Madison Ave",
  "Franklin St",
  "Adams St",
  "Monroe Blvd",
  "Jackson Ave",
  "Grant St",
  "Hamilton Pl",
  "Columbus Ave",
  "Hudson St",
  "Lexington Ave",
  "Prospect St",
  "Summit Ave",
  "Valley Rd",
  "Mountain View Dr",
  "Harbor Ln",
  "Bay St",
  "Market St",
  "Church St",
  "School St",
  "Center St",
  "Union Ave",
  "State St",
  "College Ave",
];

const CITIES = [
  "Springfield",
  "Franklin",
  "Clinton",
  "Madison",
  "Georgetown",
  "Arlington",
  "Fairview",
  "Riverside",
  "Greenville",
  "Bristol",
  "Salem",
  "Oxford",
  "Ashland",
  "Burlington",
  "Manchester",
  "Newport",
  "Lexington",
  "Richmond",
  "Auburn",
  "Clayton",
  "Milford",
  "Newark",
  "Dover",
  "Hanover",
  "Kingston",
  "Lancaster",
  "Monroe",
  "Newton",
  "Norfolk",
  "Plymouth",
  "Suffolk",
  "Troy",
  "Warren",
  "Albany",
  "Buffalo",
  "Rochester",
  "Syracuse",
  "Yonkers",
  "White Plains",
  "Ithaca",
  "Schenectady",
  "Utica",
  "Binghamton",
  "Poughkeepsie",
  "New Rochelle",
  "Mount Vernon",
  "Jamestown",
  "Elmira",
  "Watertown",
  "Oswego",
];

const ADDRESS_SUFFIX_CHANCE = 0.35;

function pickAddressSuffix(): string {
  if (Math.random() >= ADDRESS_SUFFIX_CHANCE) return "";
  const unit = randomInt(1, 500);
  return pick([` Apt ${unit}`, ` Unit ${unit}`, ` #${unit}`]);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSex(): Sex {
  return Math.random() < 0.5 ? "male" : "female";
}

function randomBirthdate(maxAgeYears: number): Date {
  const today = new Date();
  const maxDays = maxAgeYears * 365;
  const daysAgo = randomInt(0, maxDays);
  const birth = new Date(today);
  birth.setDate(birth.getDate() - daysAgo);
  return birth;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function randomPhone(): string {
  const formats = [
    () => `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
    () => `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
    () => `${randomInt(200, 999)}.${randomInt(200, 999)}.${randomInt(1000, 9999)}`,
  ];
  return pick(formats)();
}

/** Matches PhoneInput mask `(999) 999 9999` used on guardian phone. */
function randomMaskedPhone(): string {
  return `(${randomInt(200, 999)}) ${randomInt(200, 999)} ${randomInt(1000, 9999)}`;
}

function randomAdultBirthdate(minAgeYears = 25, maxAgeYears = 65): Date {
  const today = new Date();
  const daysAgo = randomInt(minAgeYears * 365, maxAgeYears * 365);
  const birth = new Date(today);
  birth.setDate(birth.getDate() - daysAgo);
  return birth;
}

const GUARDIAN_SEXES = ["Male", "Female", "Unknown"] as const;
const US_STATES = [
  "New York",
  "New Jersey",
  "Georgia",
  "Florida",
  "Ohio",
  "Alabama",
  "California",
  "Texas",
  "Pennsylvania",
  "Illinois",
] as const;

export function generateGuardianTestData() {
  const sex = randomSex();
  const firstName = pick(
    sex === "male" ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES,
  );
  const lastName = pick(LAST_NAMES);
  const suffix = pickAddressSuffix();
  const relationship =
    sex === "male"
      ? pick(["Father", "Other"] as const)
      : pick(["Mother", "Other"] as const);

  return {
    firstName,
    lastName,
    dob: formatDate(randomAdultBirthdate()),
    sex: pick(GUARDIAN_SEXES),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.guardian@example.com`,
    phone: randomMaskedPhone(),
    relationship,
    address: `${randomInt(100, 9999)} ${pick(STREET_NAMES)}${suffix}`,
    city: pick(CITIES),
    state: pick(US_STATES),
    zip: String(randomInt(10000, 99999)),
  };
}

export type GuardianTestData = ReturnType<typeof generateGuardianTestData>;

export function generatePatientTestData() {
  const sex = randomSex();
  const firstName = pick(
    sex === "male" ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES,
  );
  const lastName = pick(LAST_NAMES);
  const suffix = pickAddressSuffix();

  return {
    mrn: `QAT${randomInt(1_000_000_000, 9_999_999_999)}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: randomPhone(),
    address: `${randomInt(100, 9999)} ${pick(STREET_NAMES)}${suffix}`,
    city: pick(CITIES),
    zip: String(randomInt(10000, 99999)),
    dob: formatDate(randomBirthdate(18)),
    guardian: generateGuardianTestData(),
  };
}

export type PatientTestData = ReturnType<typeof generatePatientTestData>;
