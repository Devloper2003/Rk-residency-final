/**
 * calendar-preset.ts — suggested content calendar rows for the Braj festival
 * year (Task 4). The owner loads them with one click in Admin → Content
 * Calendar ("Load suggested Braj calendar").
 *
 * ⚠️ DATE POLICY: festival dates shift every year (they follow the lunar
 * calendar). Every row's `month` below is the APPROXIMATE Gregorian month
 * and the notes column explicitly says the exact date is a TODO the owner
 * must confirm. Nothing here is presented as a confirmed date on the site.
 *
 * Target keyword groups used across posts (see README):
 *   - core hotel:       "hotel in Vrindavan", "Vrindavan hotel booking"
 *   - local discovery:  "places to visit in Vrindavan", "Vrindavan travel guide"
 *   - brand:            "RK Residency Vrindavan"
 *   - commercial:       "book hotel near Banke Bihari Mandir", "Janmashtami hotel package Vrindavan"
 *   - attraction:       "Banke Bihari Mandir darshan", "Prem Mandir timing"
 *   - long-tail:        "hotel near ISKCON Vrindavan with satvik food", "where to stay during Lathmar Holi"
 */

export const BRAJ_CALENDAR_PRESET: {
  month: string;
  event: string;
  targetKeywords: string; // JSON array
  category: string;
  status: string;
  notes: string;
}[] = [
  {
    month: "2026-08",
    event: "Janmashtami",
    targetKeywords: JSON.stringify([
      "janmashtami vrindavan",
      "book hotel near Banke Bihari Mandir for Janmashtami",
      "where to stay in Vrindavan during Janmashtami",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm exact tithi (Aug–Sep, lunar calendar)",
  },
  {
    month: "2026-09",
    event: "Radhashtami",
    targetKeywords: JSON.stringify([
      "Radhashtami Barsana",
      "Radha Rani temple visit guide",
      "hotel in Vrindavan for Radhashtami",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm exact tithi (Sep, 15 days after Janmashtami)",
  },
  {
    month: "2027-03",
    event: "Holi & Lathmar Holi",
    targetKeywords: JSON.stringify([
      "Lathmar Holi Barsana",
      "where to stay during Holi in Vrindavan",
      "Vrindavan Holi hotel booking",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm (Feb–Mar; Lathmar Holi in Barsana/Nandgaon a few days before)",
  },
  {
    month: "2026-11",
    event: "Kartik month (month of lamps)",
    targetKeywords: JSON.stringify([
      "Kartik month Vrindavan",
      "Vrindavan in Kartik mas",
      "places to visit in Vrindavan during Kartik",
    ]),
    category: "LOCAL_TIP",
    status: "PLANNED",
    notes: "Date TODO — confirm (Oct–Nov, full lunar month)",
  },
  {
    month: "2026-11",
    event: "Govardhan Puja (Annakut)",
    targetKeywords: JSON.stringify([
      "Govardhan Puja Vrindavan",
      "Annakut darshan Govardhan hill",
      "hotel near Govardhan Vrindavan",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm (day after Diwali)",
  },
  {
    month: "2026-11",
    event: "Diwali",
    targetKeywords: JSON.stringify([
      "Diwali in Vrindavan",
      "Vrindavan Diwali deep daan Yamuna",
      "Vrindavan hotel booking Diwali",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm (Oct–Nov)",
  },
  {
    month: "2027-04",
    event: "Ram Navami",
    targetKeywords: JSON.stringify([
      "Ram Navami Vrindavan",
      "Ram Navami temple darshan Vrindavan",
      "spring travel Vrindavan hotel",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm (Mar–Apr)",
  },
  {
    month: "2026-07",
    event: "Guru Purnima",
    targetKeywords: JSON.stringify([
      "Guru Purnima Vrindavan",
      "vyas puja Guru Purnima Braj",
      "spiritual retreat Vrindavan hotel",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm (Jul)",
  },
  {
    month: "2026-10",
    event: "Sharad Purnima & Rasa Leela season",
    targetKeywords: JSON.stringify([
      "Sharad Purnima Vrindavan",
      "Rasa Leela season Braj",
      "hotel in Vrindavan for Sharad Purnima",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm (Sep–Oct, full moon of Ashwin)",
  },
  {
    month: "2027-02",
    event: "Vasant Panchami",
    targetKeywords: JSON.stringify([
      "Vasant Panchami Vrindavan",
      "Basant Panchami temple darshan",
      "Vrindavan winter travel guide",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm (Jan–Feb)",
  },
  {
    month: "2027-05",
    event: "Akshaya Tritiya",
    targetKeywords: JSON.stringify([
      "Akshaya Tritiya Vrindavan",
      "Akshaya Tritiya daan temple",
      "summer visit Vrindavan tips",
    ]),
    category: "FESTIVAL",
    status: "PLANNED",
    notes: "Date TODO — confirm (Apr–May)",
  },
];
