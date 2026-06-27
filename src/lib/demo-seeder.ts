import type { Issue, IssueCategory, IssueSeverity, IssueStatus, TimelineEvent, FeedItem } from "./types";

interface IssueTemplate {
  title: string;
  description: string;
  rootCause: string;
  rootCauseConfidence: number;
}

const TEMPLATES: Record<IssueCategory, IssueTemplate[]> = {
  road_damage: [
    {
      title: "Large Pothole near Main Crossing",
      description: "Deep pothole causing vehicles, especially two-wheelers, to swerve dangerously. Traffic slows down severely during morning rush hour.",
      rootCause: "Heavy monsoon runoff coupled with high volume of commercial vehicles",
      rootCauseConfidence: 92,
    },
    {
      title: "Severe Pothole Cluster on Service Lane",
      description: "Multiple deep potholes spread across a 50-meter stretch of the service road, causing vehicle damage and traffic backups.",
      rootCause: "Substandard asphalt mixture used during recent road repair",
      rootCauseConfidence: 85,
    },
    {
      title: "Broken Concrete Slabs on Footpath",
      description: "Broken and missing concrete tiles on the pedestrian walkway, forcing pedestrians to walk on the busy main road.",
      rootCause: "Pedestrian walkway tiles damaged by unauthorized parking of heavy delivery bikes",
      rootCauseConfidence: 78,
    },
    {
      title: "Cracked Road Surface near Metro Gate 1",
      description: "Wide cracks developing across the tarmac. Rainwater is seeping in, threatening to create a major cave-in.",
      rootCause: "Underground soil erosion due to leaking stormwater line",
      rootCauseConfidence: 89,
    },
  ],
  water: [
    {
      title: "Drinking Water Pipeline Leakage",
      description: "Potable water leaking continuously from an underground pipe junction, flooding the side lane and creating muddy puddles.",
      rootCause: "Joint corrosion in the 20-year-old main distribution line",
      rootCauseConfidence: 94,
    },
    {
      title: "Low Water Supply Pressure on Upper Floors",
      description: "Water pressure has dropped significantly over the past 3 days. High-rise apartments are unable to get water on upper floors without booster pumps.",
      rootCause: "Air lock or booster station pressure fluctuation at the main pump house",
      rootCauseConfidence: 81,
    },
    {
      title: "Contaminated Tap Water Supply",
      description: "Tap water has a dark brownish tint and foul odor. Several families have reported stomach infections.",
      rootCause: "Pipeline leakage near the drainage crossover junction causing cross-contamination",
      rootCauseConfidence: 88,
    },
    {
      title: "Water Valve Chamber Overflow",
      description: "Valves overflowing whenever the municipal supply is turned on, wasting thousands of liters of clean water.",
      rootCause: "Worn-out rubber gasket seals in the pressure control valve",
      rootCauseConfidence: 90,
    },
  ],
  waste: [
    {
      title: "Overflowing Garbage Dump at Bus Stand",
      description: "Municipal garbage container overflowing for the past 4 days. Foul smell and stray dogs/cows spreading trash everywhere.",
      rootCause: "Delayed municipal pickup schedule due to sanitation staff shortage",
      rootCauseConfidence: 87,
    },
    {
      title: "Illegal Construction Waste Dumping",
      description: "Tractor loads of concrete debris and brick fragments dumped overnight in the service lane, blocking emergency access.",
      rootCause: "Unauthorized commercial dumping during late-night hours by private contractors",
      rootCauseConfidence: 76,
    },
    {
      title: "Plastic and Dry Waste Accumulated in Park",
      description: "Piles of plastic bottles, bags, and dry leaves left uncollected in the children's park area.",
      rootCause: "Lack of proper trash bins and low public awareness at the local park",
      rootCauseConfidence: 84,
    },
    {
      title: "Unattended Commercial Waste Behind Food Plaza",
      description: "Food waste and grease dumped in open bags behind the food court, attracting rodents and creating unsanitary conditions.",
      rootCause: "Food court management avoiding commercial recycling disposal fees",
      rootCauseConfidence: 89,
    },
  ],
  lighting: [
    {
      title: "Streetlight Outage on NH Bypass Stretch",
      description: "A series of 4 consecutive streetlights are non-functional, leaving a 200m stretch in pitch dark. Security concern for residents.",
      rootCause: "Frayed underground cabling or circuit breaker trip after recent rains",
      rootCauseConfidence: 91,
    },
    {
      title: "Flickering Streetlight Near Children's Play Area",
      description: "Streetlight flickering continuously, causing blinding glares for drivers and residents nearby.",
      rootCause: "Failing capacitor in the sodium-vapor lamp fixture",
      rootCauseConfidence: 83,
    },
    {
      title: "Dark Corridor Due to Tree Branch Obstruction",
      description: "Lush tree branches completely blocking the streetlight, keeping the footpath in pitch black during nights.",
      rootCause: "Lack of regular pruning of roadside trees by local horticulture dept",
      rootCauseConfidence: 80,
    },
    {
      title: "Entire Streetlight Row Failure",
      description: "Over 8 poles completely dark on the main avenue since the thunderstorm two nights ago.",
      rootCause: "Power line transformer fuse blown near the sub-station",
      rootCauseConfidence: 95,
    },
  ],
  drainage: [
    {
      title: "Blocked Stormwater Drain Near Subway",
      description: "Storm drain fully clogged with plastic bags and silt. Even minor showers lead to waterlogging up to knee height.",
      rootCause: "Accumulation of plastic waste and construction dust in the catch basin",
      rootCauseConfidence: 90,
    },
    {
      title: "Overflowing Manhole on Market Main Road",
      description: "Sewer line backed up, causing dirty black water to overflow onto the pavement. Extremely unhygienic.",
      rootCause: "Structural collapse of the ancient brick sewer line under heavy traffic loads",
      rootCauseConfidence: 86,
    },
    {
      title: "Clogged Sewer Line Causing Backflow",
      description: "Severe grease build-up causing toilet water backflow in the ground floor apartments.",
      rootCause: "Restaurants dumping untreated grease and oil into commercial sewer connection",
      rootCauseConfidence: 91,
    },
  ],
  noise: [
    {
      title: "Loud Late-Night Speakers Near Residential Area",
      description: "Loud music playing past 11 PM, violating local noise pollution norms. Disturbs senior citizens and students.",
      rootCause: "Unauthorized wedding event organizer violating local volume guidelines",
      rootCauseConfidence: 85,
    },
    {
      title: "After-Hours Construction Noise at Commercial Hub",
      description: "High-decibel drilling and concrete mixing continuing past midnight without proper sound barriers.",
      rootCause: "Contractor rushing to meet construction deadlines before monsoon season starts",
      rootCauseConfidence: 88,
    },
  ],
  safety: [
    {
      title: "Open Utility Manhole Cover",
      description: "A utility cover is completely missing, leaving a 3-foot deep open hole in the footpath, hidden in the dark.",
      rootCause: "Theft of metal manhole cover for scrap value during late hours",
      rootCauseConfidence: 93,
    },
    {
      title: "Broken Safety Railing on Flyover Approach",
      description: "Safety barrier damaged during an accident has not been replaced, leaving a dangerous drop-off hazard.",
      rootCause: "Delayed repairs of structural barriers by public works department",
      rootCauseConfidence: 79,
    },
    {
      title: "Dangling High Voltage Cable",
      description: "A loose overhead wire is hanging close to vehicles and pedestrians near the service road turn.",
      rootCause: "Storm damage to utility pole insulator block",
      rootCauseConfidence: 87,
    },
  ],
  other: [
    {
      title: "Stray Animal Menace at Crossing",
      description: "Large pack of aggressive stray dogs chasing two-wheelers and pedestrians near the local market.",
      rootCause: "Open garbage dumping behind meat shops attracting stray animal packs",
      rootCauseConfidence: 72,
    },
    {
      title: "Encroached Footpath by Vendors",
      description: "Walkway completely occupied by vendor carts, forcing pedestrians to walk on the high-speed main road.",
      rootCause: "Lack of designated street vendor zones in the locality",
      rootCauseConfidence: 81,
    },
  ],
};

const STREET_NAMES = [
  "MG Road",
  "Ring Road Junction",
  "100 Feet Road",
  "Service Road Bypass",
  "Market Square Lane",
  "Park Avenue Extension",
  "Civil Lines crossing",
  "Main Bazar Road",
  "Sector 4 Crossing",
  "Block C service lane",
  "Nehru Marg",
  "Tagore Lane",
  "VIP Road Bypass",
  "Station Road",
  "Hospital Road",
  "School Gate Road",
];

const SEVERITIES: IssueSeverity[] = ["low", "medium", "high", "critical"];
const STATUSES: IssueStatus[] = ["reported", "verified", "in_progress", "resolved"];

export function generateSeededIssues(
  centerLat: number,
  centerLng: number,
  cityName: string = "Bengaluru"
): Issue[] {
  const issues: Issue[] = [];
  const categories = Object.keys(TEMPLATES) as IssueCategory[];
  const numIssues = Math.floor(Math.random() * 21) + 20; // 20 to 40 issues

  const cleanCity = cityName.split(",")[0].trim();

  for (let i = 0; i < numIssues; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const templates = TEMPLATES[category];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Generate random coordinates within 3-5 km (roughly 0.027 degrees max offset)
    const latOffset = (Math.random() * 2 - 1) * 0.025;
    const lngOffset = (Math.random() * 2 - 1) * 0.025;
    const latitude = centerLat + latOffset;
    const longitude = centerLng + lngOffset;

    // Severity & Status
    const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

    // Priority Score based on severity
    let basePriority = 40;
    if (severity === "medium") basePriority = 65;
    if (severity === "high") basePriority = 82;
    if (severity === "critical") basePriority = 95;
    const priority_score = Math.min(99, basePriority + Math.floor(Math.random() * 10) - 5);

    // Citizens and confidence
    const affected_citizens = Math.floor(Math.random() * 180) + 12;
    const verification_count = Math.floor(affected_citizens * 0.25) + 3;
    const confidence = Math.min(99, 70 + Math.floor(Math.random() * 30));

    const street = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
    const address = `${street}, Near ${cleanCity}`;

    // Dates from last 7 days
    const createdDaysAgo = Math.floor(Math.random() * 7);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - createdDaysAgo);
    createdDate.setHours(createdDate.getHours() - Math.floor(Math.random() * 24));
    const created_at = createdDate.toISOString();

    const updatedDate = new Date(createdDate.getTime());
    updatedDate.setHours(updatedDate.getHours() + Math.floor(Math.random() * 12));
    const updated_at = status === "reported" ? created_at : updatedDate.toISOString();

    // Timeline Events
    const timeline: TimelineEvent[] = [
      {
        id: `t-rep-${i}`,
        type: "reported",
        description: "Issue first reported by citizen",
        timestamp: created_at,
      },
    ];

    if (status !== "reported") {
      const timelineDate1 = new Date(createdDate.getTime());
      timelineDate1.setHours(timelineDate1.getHours() + 2);
      timeline: timeline.push({
        id: `t-cit-${i}`,
        type: "citizens_increased",
        description: `Affected citizen count grew to ${Math.floor(affected_citizens * 0.5)}`,
        timestamp: timelineDate1.toISOString(),
      });

      const timelineDate2 = new Date(createdDate.getTime());
      timelineDate2.setHours(timelineDate2.getHours() + 6);
      timeline: timeline.push({
        id: `t-ver-${i}`,
        type: "verified",
        description: `Community verified by ${verification_count} citizens`,
        timestamp: timelineDate2.toISOString(),
      });
    }

    if (status === "in_progress") {
      const timelineDate3 = new Date(updatedDate.getTime());
      timeline: timeline.push({
        id: `t-prog-${i}`,
        type: "priority_increased",
        description: "Assigned to local municipal department",
        timestamp: timelineDate3.toISOString(),
      });
    }

    if (status === "resolved") {
      const timelineDate3 = new Date(updatedDate.getTime());
      timeline: timeline.push({
        id: `t-res-${i}`,
        type: "resolved",
        description: "Marked as resolved. Inspected by verification team",
        timestamp: timelineDate3.toISOString(),
      });
    }

    issues.push({
      id: `seeded-${i}-${Math.random().toString(36).substring(2, 6)}`,
      title: template.title,
      description: template.description,
      category,
      severity,
      status,
      priority_score,
      confidence,
      affected_citizens,
      verification_count,
      latitude,
      longitude,
      address,
      created_at,
      updated_at,
      root_cause: template.rootCause,
      root_cause_confidence: template.rootCauseConfidence,
      similar_cases: Math.floor(Math.random() * 15) + 2,
      timeline,
    });
  }

  // Ensure there is at least one issue of each status and severity
  return issues;
}

export function generateFeedFromIssues(issues: Issue[]): FeedItem[] {
  const sorted = [...issues].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  
  return sorted.slice(0, 10).map((issue, idx) => {
    const timeDiffMinutes = (idx + 1) * 6;
    let timestamp = `${timeDiffMinutes} min ago`;
    if (timeDiffMinutes >= 60) {
      const hrs = Math.floor(timeDiffMinutes / 60);
      timestamp = `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    }

    let text = "";
    let icon = "📌";
    
    if (issue.status === "resolved") {
      text = `${issue.title} resolved at ${issue.address.split(",")[0]}`;
      icon = "✅";
    } else if (issue.status === "in_progress") {
      text = `Work started: ${issue.title} at ${issue.address.split(",")[0]}`;
      icon = "🛠";
    } else if (issue.status === "verified") {
      text = `${issue.verification_count} citizens verified: ${issue.title}`;
      icon = "👥";
    } else {
      text = `New report: ${issue.title} at ${issue.address.split(",")[0]}`;
      icon = "⚠️";
    }

    return {
      id: `feed-${issue.id}-${idx}`,
      icon,
      text,
      timestamp,
      category: issue.category,
      status: issue.status,
      title: issue.title,
      address: issue.address.split(",")[0],
      verification_count: issue.verification_count,
    };
  });
}
