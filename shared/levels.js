/**
 * Handcrafted 10-Stage Bioluminescent Co-op Adventure across 5 biomes.
 * Pure standard ES module shared by server and browser client.
 */

export const ACTS = [
  // =========================================================================
  // STAGE 1 (ACT 0): FIREFLY MEADOW — GUIDED TUTORIAL (Biome: forest)
  // =========================================================================
  {
    id: 0,
    stageNumber: 1,
    isTutorial: true,
    name: 'Firefly Meadow',
    thaiName: 'ลานฝึกหิ่งห้อย',
    subtitle: 'ด่าน 1/10 — เรียนรู้พลังแห่งตะวันและจันทรา',
    biome: 'forest',
    objective: 'ฝึกเดิน กระโดด 2 จังหวะ เผาเถาวัลย์ เสกสะพานแสง และเปิดประตูมิติ',
    stageHints: [
      'กดกระโดด 2 ครั้งติดกันเพื่อทำ Double Jump ขึ้นแท่นสูง',
      'SOLA ยิงลำแสงสุริยะเพื่อเผาเถาวัลย์เงาสีม่วงที่ขวางทางเดิน',
      'LUNA ยิงคลื่นจันทราใส่ผลึกสีฟ้าเพื่อเสกสะพานแสงข้ามน้ำตก',
      'จุดทั้งเสาตะวันและผลึกจันทราหน้าประตูโบราณเพื่อเปิดประตูมิติ',
    ],
    width: 2450,
    height: 920,
    spawns: {
      sola: { x: 130, y: 690 },
      luna: { x: 210, y: 690 },
    },
    waterfalls: [
      { id: 't-wf1', x: 1090, y: 90, w: 210, h: 830 },
    ],
    platforms: [
      { id: 't-p0', x: 0, y: 740, w: 560, h: 180, kind: 'moss' },
      { id: 't-p0-step', x: 340, y: 615, w: 160, h: 28, kind: 'moss' },
      { id: 't-p1', x: 640, y: 720, w: 430, h: 200, kind: 'moss' },
      { id: 't-roof1', x: 760, y: 0, w: 165, h: 540, kind: 'stone' },
      { id: 't-p2', x: 1340, y: 720, w: 1110, h: 200, kind: 'moss' },
      { id: 't-p2-upper', x: 1510, y: 530, w: 220, h: 28, kind: 'moss' },
      { id: 't-gate-pillar', x: 1985, y: 0, w: 130, h: 510, kind: 'stone' },
    ],
    movingPlatforms: [],
    mushrooms: [
      { id: 'mush-t1', x: 1455, y: 720, r: 28 },
    ],
    briars: [
      { id: 'briar-t1', x: 820, y: 540, w: 48, h: 180 },
    ],
    totems: [
      { id: 'totem-t-moon1', kind: 'lunar', x: 1005, y: 565, linksTo: 'bridge-t1' },
      { id: 'totem-t-sun', kind: 'solar', x: 1790, y: 662, linksTo: 'gate-t1' },
      { id: 'totem-t-moon2', kind: 'lunar', x: 1620, y: 470, linksTo: 'gate-t1' },
    ],
    bridges: [
      { id: 'bridge-t1', x: 1055, y: 720, w: 300, h: 24, requiresTotemId: 'totem-t-moon1' },
    ],
    gates: [
      {
        id: 'gate-t1',
        x: 2025,
        y: 510,
        w: 54,
        h: 210,
        requiresTotemIds: ['totem-t-sun', 'totem-t-moon2'],
      },
    ],
    hazards: [
      { id: 'abyss-t0', x: -200, y: 890, w: 2850, h: 110, kind: 'abyss' },
    ],
    shards: [
      { id: 't-s1', x: 290, y: 690 },
      { id: 't-s2', x: 420, y: 565 },
      { id: 't-s3', x: 600, y: 635 },
      { id: 't-s4', x: 1150, y: 670 },
      { id: 't-s5', x: 1260, y: 670 },
      { id: 't-s6', x: 1580, y: 480 },
      { id: 't-s7', x: 1680, y: 480 },
      { id: 't-s8', x: 2165, y: 670 },
    ],
    checkpoints: [
      { id: 't-cp1', x: 1385, y: 720 },
    ],
    enemies: [],
    portal: {
      x: 2300,
      y: 650,
      requiresGateId: 'gate-t1',
    },
    hints: [
      { x: 180, text: 'บทเรียน 1: เดินไปทางขวา แล้วกดกระโดด 2 ครั้ง (Double Jump) เพื่อเก็บผลึกด้านบน' },
      { x: 710, text: 'บทเรียน 2: SOLA กดปุ่มพลังสุริยะ เพื่อเผาเถาวัลย์เงาให้เปิดทาง' },
      { x: 960, text: 'บทเรียน 3: LUNA ยิงคลื่นจันทราใส่ผลึกสีฟ้า เพื่อเสกสะพานแสงข้ามน้ำตก' },
      { x: 1470, text: 'บทเรียน 4: เหยียบเห็ดเด้งขึ้นไปจุดผลึกจันทรา และให้ SOLA จุดเสาตะวันด้านล่าง!' },
    ],
  },

  // =========================================================================
  // STAGE 2 (ACT 1): WHISPERING GLADE (Biome: forest)
  // =========================================================================
  {
    id: 1,
    stageNumber: 2,
    name: 'Whispering Glade',
    thaiName: 'ป่าหิ่งห้อยกระซิบ',
    subtitle: 'ด่าน 2/10 — เถาวัลย์เงาและผีเสื้อแสง',
    biome: 'forest',
    objective: 'ร่วมมือกันผ่านป่าเรืองแสง กำจัดเงามืด และเปิดประตูสู่น้ำตกหมอก',
    stageHints: [
      'กระโดดเหยียบหัวคู่หูเพื่อพุ่งตัวสูง (Partner Boost) เก็บผลึกที่อยู่สูง',
      'ศัตรูที่มีแกนสีทองแพ้พลังตะวัน ส่วนแกนสีฟ้าแพ้พลังจันทรา (โดนพลังน้ำแข็งจะชะงัก)',
      'กดปุ่ม "ผสาน" เมื่ออยู่ใกล้คู่หูเพื่อฟื้นพลังชีวิต +1 หรือชุบชีวิตเพื่อนจากร่างวิญญาณ',
    ],
    width: 3400,
    height: 950,
    spawns: {
      sola: { x: 140, y: 690 },
      luna: { x: 220, y: 690 },
    },
    waterfalls: [
      { id: 'wf-1', x: 1450, y: 90, w: 240, h: 860 },
      { id: 'wf-2', x: 2820, y: 70, w: 175, h: 880 },
    ],
    platforms: [
      { id: 'p0', x: 0, y: 740, w: 680, h: 210, kind: 'moss' },
      { id: 'p1', x: 470, y: 660, w: 150, h: 30, kind: 'moss' },
      { id: 'p2', x: 780, y: 720, w: 620, h: 230, kind: 'moss' },
      { id: 'p_step_up', x: 820, y: 625, w: 120, h: 28, kind: 'moss' },
      { id: 'p_roof1', x: 960, y: 0, w: 185, h: 540, kind: 'stone' },
      { id: 'p3', x: 1740, y: 720, w: 720, h: 230, kind: 'moss' },
      { id: 'p_canopy1', x: 1940, y: 525, w: 270, h: 30, kind: 'moss' },
      { id: 'p4', x: 2570, y: 730, w: 830, h: 220, kind: 'stone' },
      { id: 'p_cliff_upper', x: 2630, y: 535, w: 240, h: 30, kind: 'moss' },
      { id: 'p_gate_pillar', x: 2940, y: 0, w: 135, h: 520, kind: 'stone' },
    ],
    movingPlatforms: [],
    mushrooms: [
      { id: 'mush-1', x: 1860, y: 720, r: 28 },
      { id: 'mush-2', x: 2595, y: 730, r: 28 },
    ],
    briars: [
      { id: 'briar-1', x: 1030, y: 540, w: 48, h: 180 },
    ],
    totems: [
      { id: 'totem-moon-1', kind: 'lunar', x: 1350, y: 560, linksTo: 'bridge-1' },
      { id: 'totem-sun-1', kind: 'solar', x: 2675, y: 672, linksTo: 'gate-1' },
      { id: 'totem-moon-2', kind: 'lunar', x: 2770, y: 475, linksTo: 'gate-1' },
    ],
    bridges: [
      { id: 'bridge-1', x: 1390, y: 720, w: 360, h: 24, requiresTotemId: 'totem-moon-1' },
    ],
    gates: [
      {
        id: 'gate-1',
        x: 2980,
        y: 520,
        w: 54,
        h: 210,
        requiresTotemIds: ['totem-sun-1', 'totem-moon-2'],
      },
    ],
    hazards: [
      { id: 'abyss-0', x: -200, y: 920, w: 3800, h: 100, kind: 'abyss' },
    ],
    shards: [
      { id: 'a0-s1', x: 375, y: 690 },
      { id: 'a0-s2', x: 545, y: 615 },
      { id: 'a0-s3', x: 880, y: 580 },
      { id: 'a0-s4', x: 1515, y: 670 },
      { id: 'a0-s5', x: 1635, y: 670 },
      { id: 'a0-s6', x: 2015, y: 480 },
      { id: 'a0-s7', x: 2145, y: 480 },
      { id: 'a0-s8', x: 2280, y: 670 },
      { id: 'a0-s9', x: 2515, y: 590 },
      { id: 'a0-s10', x: 2690, y: 485 },
      { id: 'a0-s11', x: 2820, y: 485 },
      { id: 'a0-s12', x: 3140, y: 680 },
    ],
    checkpoints: [
      { id: 'a0-cp1', x: 1290, y: 720 },
      { id: 'a0-cp2', x: 2405, y: 720 },
    ],
    enemies: [
      { id: 'a0-e1', x: 1230, y: 670, patrolMinX: 1130, patrolMaxX: 1365, affinity: 'solar', hp: 44 },
      { id: 'a0-e2', x: 2180, y: 670, patrolMinX: 2020, patrolMaxX: 2375, affinity: 'lunar', hp: 44 },
    ],
    portal: {
      x: 3255,
      y: 660,
      requiresGateId: 'gate-1',
    },
    hints: [
      { x: 200, text: 'ลองเหยียบหัวคู่หูเพื่อพุ่งขึ้นที่สูง หรือกดปุ่ม "ผสาน" เมื่ออยู่ใกล้กัน' },
      { x: 930, text: 'SOLA: กดพลังสุริยะเผาเถาวัลย์เงา แล้วยิงใส่ภูตเงาแกนสีทอง' },
      { x: 1300, text: 'LUNA: ยิงคลื่นจันทราที่ผลึกสีฟ้าเพื่อเสกสะพานแสง' },
      { x: 2620, text: 'SOLA จุดเสาตะวันด้านล่าง และ LUNA เหยียบเห็ดขึ้นไปจุดผลึกด้านบน!' },
    ],
  },

  // =========================================================================
  // STAGE 3 (ACT 2): MISTY CASCADE VALLEY (Biome: forest)
  // =========================================================================
  {
    id: 2,
    stageNumber: 3,
    name: 'Misty Cascade Valley',
    thaiName: 'หุบเขาน้ำตกหมอก',
    subtitle: 'ด่าน 3/10 — หุบเขาน้ำตกและเห็ดสปริงเรืองแสง',
    biome: 'forest',
    objective: 'ไต่ระดับผ่านน้ำตก 3 สายด้วยเห็ดเด้งและสะพานจันทราคู่',
    stageHints: [
      'เห็ดเรืองแสงช่วยส่งตัวขึ้นสู่ชะง่อนผาสูงได้ทันทีโดยไม่ต้องเสีย Double Jump',
      'ด่านนี้มีสะพานแสง 2 ช่วง ให้ LUNA ช่วยเปิดทางข้ามหุบเขาก่อน',
      'หลังผ่านด่าน 3 เราจะขึ้นสู่ยอดไม้แสงเหนือ!',
    ],
    width: 3600,
    height: 980,
    spawns: {
      sola: { x: 120, y: 720 },
      luna: { x: 205, y: 720 },
    },
    waterfalls: [
      { id: 's3-wf1', x: 640, y: 80, w: 190, h: 900 },
      { id: 's3-wf2', x: 1690, y: 70, w: 220, h: 910 },
      { id: 's3-wf3', x: 2770, y: 90, w: 200, h: 890 },
    ],
    platforms: [
      { id: 's3-p0', x: 0, y: 770, w: 540, h: 210, kind: 'moss' },
      { id: 's3-p1', x: 870, y: 730, w: 740, h: 250, kind: 'moss' },
      { id: 's3-p1-hi', x: 1020, y: 540, w: 260, h: 28, kind: 'moss' },
      { id: 's3-p2', x: 1940, y: 690, w: 730, h: 290, kind: 'moss' },
      { id: 's3-arch', x: 2210, y: 0, w: 170, h: 510, kind: 'stone' },
      { id: 's3-p3', x: 3000, y: 690, w: 600, h: 290, kind: 'stone' },
      { id: 's3-p3-hi', x: 3040, y: 495, w: 200, h: 28, kind: 'moss' },
      { id: 's3-gate-pillar', x: 3255, y: 0, w: 135, h: 480, kind: 'stone' },
    ],
    movingPlatforms: [],
    mushrooms: [
      { id: 'mush-s3-1', x: 940, y: 730, r: 28 },
      { id: 'mush-s3-2', x: 3210, y: 690, r: 28 },
    ],
    briars: [
      { id: 'briar-s3-1', x: 2270, y: 510, w: 48, h: 180 },
    ],
    totems: [
      { id: 'totem-s3-moon1', kind: 'lunar', x: 470, y: 605, linksTo: 'bridge-s3-1' },
      { id: 'totem-s3-moon2', kind: 'lunar', x: 1550, y: 565, linksTo: 'bridge-s3-2' },
      { id: 'totem-s3-sun-bless', kind: 'solar', x: 2490, y: 632, linksTo: 'blessing' },
      { id: 'totem-s3-moon3', kind: 'lunar', x: 2610, y: 525, linksTo: 'bridge-s3-3' },
      { id: 'totem-s3-sun1', kind: 'solar', x: 3095, y: 632, linksTo: 'gate-s3' },
      { id: 'totem-s3-moon4', kind: 'lunar', x: 3130, y: 435, linksTo: 'gate-s3' },
    ],
    bridges: [
      { id: 'bridge-s3-1', x: 530, y: 745, w: 350, h: 24, requiresTotemId: 'totem-s3-moon1' },
      { id: 'bridge-s3-2', x: 1600, y: 705, w: 350, h: 24, requiresTotemId: 'totem-s3-moon2' },
      { id: 'bridge-s3-3', x: 2660, y: 690, w: 350, h: 24, requiresTotemId: 'totem-s3-moon3' },
    ],
    gates: [
      {
        id: 'gate-s3',
        x: 3295,
        y: 480,
        w: 54,
        h: 210,
        requiresTotemIds: ['totem-s3-sun1', 'totem-s3-moon4'],
      },
    ],
    hazards: [
      { id: 'abyss-s3', x: -200, y: 950, w: 4000, h: 110, kind: 'abyss' },
    ],
    shards: [
      { id: 's3-s1', x: 300, y: 720 },
      { id: 's3-s2', x: 690, y: 695 },
      { id: 's3-s3', x: 1090, y: 490 },
      { id: 's3-s4', x: 1200, y: 490 },
      { id: 's3-s5', x: 1380, y: 680 },
      { id: 's3-s6', x: 1775, y: 655 },
      { id: 's3-s7', x: 2050, y: 640 },
      { id: 's3-s8', x: 2410, y: 640 },
      { id: 's3-s9', x: 2835, y: 640 },
      { id: 's3-s10', x: 3090, y: 445 },
      { id: 's3-s11', x: 3175, y: 445 },
      { id: 's3-s12', x: 3405, y: 640 },
    ],
    checkpoints: [
      { id: 's3-cp1', x: 1995, y: 690 },
    ],
    enemies: [
      { id: 's3-e1', x: 1320, y: 680, patrolMinX: 1150, patrolMaxX: 1520, affinity: 'solar', hp: 48 },
      { id: 's3-e2', x: 2100, y: 640, patrolMinX: 2000, patrolMaxX: 2210, affinity: 'lunar', hp: 48 },
      { id: 's3-e3', x: 2490, y: 640, patrolMinX: 2360, patrolMaxX: 2610, affinity: 'solar', hp: 48 },
    ],
    portal: {
      x: 3485,
      y: 620,
      requiresGateId: 'gate-s3',
    },
    hints: [
      { x: 360, text: 'LUNA: ยิงคลื่นจันทราจุดผลึกหน้าผาเพื่อสร้างสะพานข้ามน้ำตกสายแรก' },
      { x: 2120, text: 'SOLA: เผาเถาวัลย์เงาแล้วจุดเสาตะวันด้านในเพื่อรับพรฟื้นฟูเลือดทั้งคู่!' },
      { x: 3030, text: 'เหยียบเห็ดสปริงขึ้นไปจุดผลึกด้านบน เปิดประตูสู่ยอดไม้แสงเหนือ' },
    ],
  },

  // =========================================================================
  // STAGE 4 (ACT 3): AURORA CANOPY (Biome: canopy)
  // =========================================================================
  {
    id: 3,
    stageNumber: 4,
    name: 'Aurora Canopy',
    thaiName: 'ยอดไม้แสงเหนือ',
    subtitle: 'ด่าน 4/10 — แท่นลอยฟ้าใต้แสงอรุณและออโรรา',
    biome: 'canopy',
    objective: 'ร่วมเดินทางบนแท่นลอยฟ้าเหนือยอดไม้ยักษ์ และสลับพลังเปิดทาง',
    stageHints: [
      'แท่นลอยฟ้าเคลื่อนที่ไปตามจังหวะ รอให้เพื่อนขึ้นพร้อมกันก่อนก้าวข้าม',
      'ยอดไม้มีช่องว่างลมแรง ใช้ Double Jump ปรับจังหวะลงกลางแท่น',
      'เสาสุริยันซ่อนอยู่หลังเถาวัลย์เงาบนกิ่งกลาง ต้องให้ SOLA เคลียร์ทางก่อน',
    ],
    width: 3600,
    height: 980,
    spawns: {
      sola: { x: 130, y: 710 },
      luna: { x: 210, y: 710 },
    },
    waterfalls: [
      { id: 's4-wf1', x: 1350, y: 90, w: 200, h: 890 },
      { id: 's4-wf2', x: 2740, y: 80, w: 195, h: 900 },
    ],
    platforms: [
      { id: 's4-p0', x: 0, y: 760, w: 520, h: 220, kind: 'moss' },
      { id: 's4-p1', x: 910, y: 720, w: 410, h: 260, kind: 'moss' },
      { id: 's4-p2', x: 1640, y: 680, w: 620, h: 300, kind: 'moss' },
      { id: 's4-arch', x: 1890, y: 0, w: 170, h: 500, kind: 'stone' },
      { id: 's4-p2-hi', x: 1670, y: 510, w: 185, h: 28, kind: 'moss' },
      { id: 's4-p3', x: 2630, y: 650, w: 970, h: 330, kind: 'moss' },
      { id: 's4-p3-hi', x: 2940, y: 455, w: 210, h: 28, kind: 'moss' },
      { id: 's4-gate-pillar', x: 3180, y: 0, w: 145, h: 440, kind: 'stone' },
    ],
    movingPlatforms: [
      { id: 'mp-s4-1', x: 640, y: 735, w: 145, h: 26, dx: 115, dy: 0, speed: 1.05, phase: 0 },
      { id: 'mp-s4-2', x: 2375, y: 665, w: 145, h: 26, dx: 105, dy: 0, speed: 1.1, phase: 1.1 },
    ],
    mushrooms: [
      { id: 'mush-s4-1', x: 1715, y: 680, r: 28 },
      { id: 'mush-s4-2', x: 2880, y: 650, r: 28 },
    ],
    briars: [
      { id: 'briar-s4-1', x: 1955, y: 500, w: 48, h: 180 },
    ],
    totems: [
      { id: 'totem-s4-moon1', kind: 'lunar', x: 1270, y: 560, linksTo: 'bridge-s4-1' },
      { id: 'totem-s4-sun1', kind: 'solar', x: 2990, y: 592, linksTo: 'gate-s4' },
      { id: 'totem-s4-moon2', kind: 'lunar', x: 3045, y: 395, linksTo: 'gate-s4' },
    ],
    bridges: [
      { id: 'bridge-s4-1', x: 1310, y: 700, w: 340, h: 24, requiresTotemId: 'totem-s4-moon1' },
    ],
    gates: [
      {
        id: 'gate-s4',
        x: 3225,
        y: 440,
        w: 54,
        h: 210,
        requiresTotemIds: ['totem-s4-sun1', 'totem-s4-moon2'],
      },
    ],
    hazards: [
      { id: 'abyss-s4', x: -200, y: 950, w: 4000, h: 110, kind: 'abyss' },
    ],
    shards: [
      { id: 's4-s1', x: 310, y: 710 },
      { id: 's4-s2', x: 640, y: 665 },
      { id: 's4-s3', x: 775, y: 665 },
      { id: 's4-s4', x: 1080, y: 670 },
      { id: 's4-s5', x: 1415, y: 650 },
      { id: 's4-s6', x: 1545, y: 650 },
      { id: 's4-s7', x: 1755, y: 460 },
      { id: 's4-s8', x: 2125, y: 630 },
      { id: 's4-s9', x: 2375, y: 595 },
      { id: 's4-s10', x: 2510, y: 595 },
      { id: 's4-s11', x: 2770, y: 600 },
      { id: 's4-s12', x: 2995, y: 405 },
      { id: 's4-s13', x: 3095, y: 405 },
      { id: 's4-s14', x: 3365, y: 600 },
    ],
    checkpoints: [
      { id: 's4-cp1', x: 1685, y: 680 },
      { id: 's4-cp2', x: 2690, y: 650 },
    ],
    enemies: [
      { id: 's4-e1', x: 1110, y: 670, patrolMinX: 960, patrolMaxX: 1260, affinity: 'lunar', hp: 52 },
      { id: 's4-e2', x: 2130, y: 630, patrolMinX: 2040, patrolMaxX: 2220, affinity: 'solar', hp: 52 },
      { id: 's4-e3', x: 2810, y: 600, patrolMinX: 2690, patrolMaxX: 2950, affinity: 'lunar', hp: 52 },
    ],
    portal: {
      x: 3470,
      y: 580,
      requiresGateId: 'gate-s4',
    },
    hints: [
      { x: 450, text: 'ก้าวขึ้นแท่นคริสตัลลอยฟ้าข้ามยอดไม้ไปด้วยกัน' },
      { x: 1850, text: 'SOLA เผาเถาวัลย์เงากลางสะพานกิ่งไม้เพื่อเดินต่อ!' },
      { x: 2920, text: 'ข้างหน้าคือหอคอยลมสุริยะที่บอสรองเฝ้าอยู่ จุดประตูมิติเตรียมพร้อม!' },
    ],
  },

  // =========================================================================
  // STAGE 5 (ACT 4): SOLAR WIND SPIRE — MINI-BOSS ARENA (Biome: canopy)
  // =========================================================================
  {
    id: 4,
    stageNumber: 5,
    name: 'Solar Wind Spire',
    thaiName: 'หอคอยลมสุริยะ',
    subtitle: 'ด่าน 5/10 — พิชิตวิญญาณวายุเงา (มินิบอสกลางทาง)',
    biome: 'canopy',
    objective: 'ปราบมินิบอส "วิญญาณวายุเงา" เพื่อปลดล็อกประตูมิติสู่ถ้ำน้ำตกผลึก',
    stageHints: [
      'สังเกตสีแกนกลางของมินิบอส: สีทองแพ้พลังตะวัน สีฟ้าแพ้พลังจันทรา',
      'เมื่อมินิบอสกางเกราะวายุตอนเลือดเหลือครึ่งเดียว ให้ SOLA จุดเสาซ้าย และ LUNA จุดผลึกขวา!',
      'เห็ดเด้งทั้งสองฝั่งช่วยหลบลูกพลังและกระโดดขึ้นแท่นสูงได้เร็วมาก',
    ],
    width: 1800,
    height: 950,
    spawns: {
      sola: { x: 250, y: 730 },
      luna: { x: 345, y: 730 },
    },
    waterfalls: [
      { id: 's5-wf1', x: 210, y: 70, w: 145, h: 880 },
      { id: 's5-wf2', x: 1445, y: 70, w: 145, h: 880 },
    ],
    platforms: [
      { id: 's5-floor', x: 0, y: 780, w: 1800, h: 170, kind: 'moss' },
      { id: 's5-left-low', x: 180, y: 665, w: 230, h: 28, kind: 'moss' },
      { id: 's5-right-low', x: 1390, y: 665, w: 230, h: 28, kind: 'moss' },
      { id: 's5-left-high', x: 370, y: 490, w: 230, h: 28, kind: 'moss' },
      { id: 's5-right-high', x: 1200, y: 490, w: 230, h: 28, kind: 'moss' },
      { id: 's5-center', x: 750, y: 585, w: 300, h: 28, kind: 'stone' },
    ],
    movingPlatforms: [],
    mushrooms: [
      { id: 'mush-s5-1', x: 115, y: 780, r: 28 },
      { id: 'mush-s5-2', x: 1685, y: 780, r: 28 },
    ],
    briars: [],
    totems: [
      { id: 'mb-totem-sun', kind: 'solar', x: 470, y: 432, linksTo: 'boss-shield', bossTotem: true },
      { id: 'mb-totem-moon', kind: 'lunar', x: 1330, y: 432, linksTo: 'boss-shield', bossTotem: true },
    ],
    bridges: [],
    gates: [],
    hazards: [
      { id: 'abyss-s5', x: -200, y: 920, w: 2200, h: 110, kind: 'abyss' },
    ],
    shards: [
      { id: 's5-s1', x: 250, y: 615 },
      { id: 's5-s2', x: 335, y: 615 },
      { id: 's5-s3', x: 455, y: 440 },
      { id: 's5-s4', x: 540, y: 440 },
      { id: 's5-s5', x: 830, y: 535 },
      { id: 's5-s6', x: 970, y: 535 },
      { id: 's5-s7', x: 1260, y: 440 },
      { id: 's5-s8', x: 1345, y: 440 },
      { id: 's5-s9', x: 1465, y: 615 },
      { id: 's5-s10', x: 1550, y: 615 },
    ],
    checkpoints: [
      { id: 's5-cp1', x: 900, y: 780 },
    ],
    enemies: [],
    boss: {
      name: 'Solstice Wraith',
      thaiName: 'วิญญาณวายุเงา — มินิบอสหอคอยลม',
      x: 900,
      y: 295,
      maxHp: 210,
      style: 'wraith',
      isMiniBoss: true,
      shieldThresholds: [0.5],
      sunTotemId: 'mb-totem-sun',
      moonTotemId: 'mb-totem-moon',
    },
    portal: {
      x: 900,
      y: 710,
      requiresBossDefeated: true,
    },
    hints: [
      { x: 260, text: 'เล็งยิงธาตุให้ตรงกับสีแกนกลางของมินิบอส เพื่อทำดาเมจแรงขึ้น!' },
      { x: 820, text: 'เมื่อบอสกางเกราะ ให้ SOLA จุดเสาฝั่งซ้าย และ LUNA จุดผลึกฝั่งขวา!' },
    ],
  },

  // =========================================================================
  // STAGE 6 (ACT 5): CRYSTAL FALLS CAVERN (Biome: cavern)
  // =========================================================================
  {
    id: 5,
    stageNumber: 6,
    name: 'Crystal Falls Cavern',
    thaiName: 'ถ้ำน้ำตกผลึก',
    subtitle: 'ด่าน 6/10 — สะพานแห่งวิญญาณและลิฟต์คริสตัล',
    biome: 'cavern',
    objective: 'ฝ่าถ้ำผลึกเรืองแสง ใช้ลิฟต์คริสตัล และเปิดประตูสู่เขาวงกตสะท้อนแสง',
    stageHints: [
      'แท่นลอยแรกเลื่อนแนวนอน ส่วนแท่นที่สองเลื่อนขึ้น-ลงเป็นลิฟต์สู่ชั้นบน',
      'หลังเผาเถาวัลย์เงา อย่าลืมจุดเสาตะวันด้านหลังเพื่อรับพรฟื้นฟูพลังชีวิต!',
      'ศัตรูในถ้ำมีความไวสูง ให้ LUNA ยิงคลื่นจันทราแช่แข็งให้ชะงักก่อนช่วยกันรุม',
    ],
    width: 3800,
    height: 1050,
    spawns: {
      sola: { x: 130, y: 740 },
      luna: { x: 215, y: 740 },
    },
    waterfalls: [
      { id: 'c-wf1', x: 630, y: 80, w: 220, h: 970 },
      { id: 'c-wf2', x: 1500, y: 60, w: 235, h: 990 },
      { id: 'c-wf3', x: 3060, y: 90, w: 210, h: 960 },
    ],
    platforms: [
      { id: 'c0', x: 0, y: 790, w: 540, h: 260, kind: 'crystal' },
      { id: 'c1', x: 930, y: 740, w: 520, h: 310, kind: 'crystal' },
      { id: 'c1_ledge', x: 1020, y: 620, w: 170, h: 28, kind: 'crystal' },
      { id: 'c2', x: 1780, y: 740, w: 570, h: 310, kind: 'crystal' },
      { id: 'c_arch1', x: 1965, y: 0, w: 180, h: 560, kind: 'stone' },
      { id: 'c3', x: 2580, y: 540, w: 620, h: 510, kind: 'crystal' },
      { id: 'c3_upper', x: 2775, y: 375, w: 230, h: 28, kind: 'crystal' },
      { id: 'c4', x: 3290, y: 620, w: 510, h: 430, kind: 'crystal' },
      { id: 'c4_upper', x: 3295, y: 430, w: 180, h: 28, kind: 'crystal' },
      { id: 'c_gate_pillar', x: 3485, y: 0, w: 150, h: 410, kind: 'stone' },
    ],
    movingPlatforms: [
      { id: 'mp-1', x: 660, y: 750, w: 145, h: 26, dx: 115, dy: 0, speed: 1.05, phase: 0 },
      { id: 'mp-2', x: 2395, y: 650, w: 145, h: 26, dx: 0, dy: -115, speed: 1.15, phase: 0.9 },
    ],
    mushrooms: [
      { id: 'mush-3', x: 2710, y: 540, r: 28 },
      { id: 'mush-4', x: 3480, y: 620, r: 28 },
    ],
    briars: [
      { id: 'briar-2', x: 2030, y: 560, w: 48, h: 180 },
    ],
    totems: [
      { id: 'totem-moon-3', kind: 'lunar', x: 1345, y: 580, linksTo: 'bridge-2' },
      { id: 'totem-sun-2', kind: 'solar', x: 2225, y: 682, linksTo: 'blessing' },
      { id: 'totem-sun-3', kind: 'solar', x: 3365, y: 562, linksTo: 'gate-2' },
      { id: 'totem-moon-4', kind: 'lunar', x: 3385, y: 370, linksTo: 'gate-2' },
    ],
    bridges: [
      { id: 'bridge-2', x: 1440, y: 740, w: 350, h: 24, requiresTotemId: 'totem-moon-3' },
    ],
    gates: [
      {
        id: 'gate-2',
        x: 3530,
        y: 410,
        w: 54,
        h: 210,
        requiresTotemIds: ['totem-sun-3', 'totem-moon-4'],
      },
    ],
    hazards: [
      { id: 'abyss-1', x: -200, y: 1015, w: 4200, h: 120, kind: 'abyss' },
    ],
    shards: [
      { id: 'a1-s1', x: 360, y: 740 },
      { id: 'a1-s2', x: 670, y: 675 },
      { id: 'a1-s3', x: 800, y: 675 },
      { id: 'a1-s4', x: 1105, y: 570 },
      { id: 'a1-s5', x: 1550, y: 690 },
      { id: 'a1-s6', x: 1680, y: 690 },
      { id: 'a1-s7', x: 2165, y: 690 },
      { id: 'a1-s8', x: 2465, y: 510 },
      { id: 'a1-s9', x: 2680, y: 490 },
      { id: 'a1-s10', x: 2835, y: 325 },
      { id: 'a1-s11', x: 2945, y: 325 },
      { id: 'a1-s12', x: 3060, y: 490 },
      { id: 'a1-s13', x: 3245, y: 510 },
      { id: 'a1-s14', x: 3340, y: 380 },
      { id: 'a1-s15', x: 3435, y: 380 },
      { id: 'a1-s16', x: 3630, y: 570 },
    ],
    checkpoints: [
      { id: 'a1-cp1', x: 1835, y: 740 },
      { id: 'a1-cp2', x: 2635, y: 540 },
    ],
    enemies: [
      { id: 'a1-e1', x: 1210, y: 690, patrolMinX: 1030, patrolMaxX: 1410, affinity: 'lunar', hp: 50 },
      { id: 'a1-e2', x: 2230, y: 690, patrolMinX: 2120, patrolMaxX: 2325, affinity: 'solar', hp: 50 },
      { id: 'a1-e3', x: 2900, y: 490, patrolMinX: 2740, patrolMaxX: 3150, affinity: 'solar', hp: 56 },
      { id: 'a1-e4', x: 3020, y: 490, patrolMinX: 2810, patrolMaxX: 3165, affinity: 'lunar', hp: 56 },
    ],
    portal: {
      x: 3705,
      y: 550,
      requiresGateId: 'gate-2',
    },
    hints: [
      { x: 520, text: 'กะจังหวะก้าวขึ้นแท่นคริสตัลลอยน้ำไปด้วยกัน' },
      { x: 1900, text: 'SOLA เผาเถาวัลย์ด้านล่างก่อน แล้วขึ้นลิฟต์แสงไปด้วยกัน' },
      { x: 3320, text: 'จุดทั้งเสาตะวันและผลึกจันทราหน้าประตู เพื่อเปิดทางสู่เขาวงกต' },
    ],
  },

  // =========================================================================
  // STAGE 7 (ACT 6): PRISM MIRROR GROTTO (Biome: cavern)
  // =========================================================================
  {
    id: 6,
    stageNumber: 7,
    name: 'Prism Mirror Grotto',
    thaiName: 'เขาวงกตสะท้อนแสง',
    subtitle: 'ด่าน 7/10 — ถ้ำแยกชั้นและการประสานพลังข้ามระดับ',
    biome: 'cavern',
    objective: 'แยกหน้าที่กันระหว่างชั้นบนและชั้นล่าง เพื่อปลดทางผ่านเขาวงกต',
    stageHints: [
      'ช่วงกลางถ้ำมีทางแยกบน-ล่าง: ให้คนหนึ่งขึ้นทางเห็ดเด้ง อีกคนเดินผ่านอุโมงค์เถาวัลย์',
      'ผลึกจันทราแรกอยู่บนชั้นลอย ให้ LUNA กระโดดขึ้นเห็ดไปเปิดสะพานแสงให้คู่หู',
      'อย่าลืมจุดตะเกียงเซฟก่อนขึ้นลิฟต์ผลึกช่วงท้าย',
    ],
    width: 3700,
    height: 1020,
    spawns: {
      sola: { x: 120, y: 740 },
      luna: { x: 200, y: 740 },
    },
    waterfalls: [
      { id: 's7-wf1', x: 860, y: 70, w: 200, h: 950 },
      { id: 's7-wf2', x: 2050, y: 80, w: 210, h: 940 },
      { id: 's7-wf3', x: 2940, y: 70, w: 190, h: 950 },
    ],
    platforms: [
      { id: 's7-p0', x: 0, y: 790, w: 780, h: 230, kind: 'crystal' },
      { id: 's7-p0-hi', x: 560, y: 585, w: 190, h: 28, kind: 'crystal' },
      { id: 's7-p1', x: 1120, y: 760, w: 850, h: 260, kind: 'crystal' },
      { id: 's7-p1-hi', x: 1290, y: 565, w: 380, h: 30, kind: 'crystal' },
      { id: 's7-arch1', x: 1470, y: 0, w: 150, h: 565, kind: 'stone' },
      { id: 's7-p2', x: 2310, y: 740, w: 560, h: 280, kind: 'crystal' },
      { id: 's7-arch2', x: 2510, y: 0, w: 155, h: 560, kind: 'stone' },
      { id: 's7-p3', x: 3170, y: 590, w: 530, h: 430, kind: 'crystal' },
      { id: 's7-p3-hi', x: 3190, y: 405, w: 185, h: 28, kind: 'crystal' },
      { id: 's7-gate-pillar', x: 3390, y: 0, w: 135, h: 380, kind: 'stone' },
    ],
    movingPlatforms: [
      { id: 'mp-s7-1', x: 2955, y: 660, w: 145, h: 26, dx: 0, dy: -105, speed: 1.15, phase: 0.4 },
    ],
    mushrooms: [
      { id: 'mush-s7-1', x: 510, y: 790, r: 28 },
      { id: 'mush-s7-2', x: 1225, y: 760, r: 28 },
      { id: 'mush-s7-3', x: 3375, y: 590, r: 28 },
    ],
    briars: [
      { id: 'briar-s7-1', x: 1525, y: 595, w: 48, h: 165 },
      { id: 'briar-s7-2', x: 2565, y: 560, w: 48, h: 180 },
    ],
    totems: [
      { id: 'totem-s7-moon1', kind: 'lunar', x: 695, y: 525, linksTo: 'bridge-s7-1' },
      { id: 'totem-s7-moon2', kind: 'lunar', x: 1915, y: 595, linksTo: 'bridge-s7-2' },
      { id: 'totem-s7-sun1', kind: 'solar', x: 3255, y: 532, linksTo: 'gate-s7' },
      { id: 'totem-s7-moon3', kind: 'lunar', x: 3285, y: 345, linksTo: 'gate-s7' },
    ],
    bridges: [
      { id: 'bridge-s7-1', x: 770, y: 775, w: 360, h: 24, requiresTotemId: 'totem-s7-moon1' },
      { id: 'bridge-s7-2', x: 1960, y: 745, w: 360, h: 24, requiresTotemId: 'totem-s7-moon2' },
    ],
    gates: [
      {
        id: 'gate-s7',
        x: 3430,
        y: 380,
        w: 54,
        h: 210,
        requiresTotemIds: ['totem-s7-sun1', 'totem-s7-moon3'],
      },
    ],
    hazards: [
      { id: 'abyss-s7', x: -200, y: 990, w: 4100, h: 120, kind: 'abyss' },
    ],
    shards: [
      { id: 's7-s1', x: 310, y: 740 },
      { id: 's7-s2', x: 615, y: 535 },
      { id: 's7-s3', x: 920, y: 725 },
      { id: 's7-s4', x: 1030, y: 725 },
      { id: 's7-s5', x: 1350, y: 515 },
      { id: 's7-s6', x: 1450, y: 515 },
      { id: 's7-s7', x: 1710, y: 710 },
      { id: 's7-s8', x: 2080, y: 695 },
      { id: 's7-s9', x: 2210, y: 695 },
      { id: 's7-s10', x: 2425, y: 690 },
      { id: 's7-s11', x: 2745, y: 690 },
      { id: 's7-s12', x: 3025, y: 510 },
      { id: 's7-s13', x: 3250, y: 355 },
      { id: 's7-s14', x: 3540, y: 540 },
    ],
    checkpoints: [
      { id: 's7-cp1', x: 1180, y: 760 },
      { id: 's7-cp2', x: 2350, y: 740 },
    ],
    enemies: [
      { id: 's7-e1', x: 1360, y: 710, patrolMinX: 1270, patrolMaxX: 1480, affinity: 'lunar', hp: 56 },
      { id: 's7-e2', x: 1740, y: 710, patrolMinX: 1615, patrolMaxX: 1920, affinity: 'solar', hp: 56 },
      { id: 's7-e3', x: 2430, y: 690, patrolMinX: 2340, patrolMaxX: 2530, affinity: 'solar', hp: 58 },
      { id: 's7-e4', x: 2750, y: 690, patrolMinX: 2635, patrolMaxX: 2835, affinity: 'lunar', hp: 58 },
    ],
    portal: {
      x: 3610,
      y: 520,
      requiresGateId: 'gate-s7',
    },
    hints: [
      { x: 450, text: 'LUNA: เหยียบเห็ดขึ้นชั้นลอยเพื่อจุดผลึกสีฟ้าเปิดสะพานข้ามน้ำตก!' },
      { x: 1350, text: 'SOLA เผาเถาวัลย์ด้านล่าง ส่วน LUNA เดินด้านบนช่วยกันเก็บผลึกวิญญาณ' },
      { x: 2810, text: 'ขึ้นลิฟต์คริสตัลไปปลดผนึกประตูสู่เขตซากวิหารจันทรา!' },
    ],
  },

  // =========================================================================
  // STAGE 8 (ACT 7): MOONLIT RUIN CHASM (Biome: abyss)
  // =========================================================================
  {
    id: 7,
    stageNumber: 8,
    name: 'Moonlit Ruin Chasm',
    thaiName: 'ซากวิหารจันทรา',
    subtitle: 'ด่าน 8/10 — ซากโบราณสถานท่ามกลางห้วงรัตติกาล',
    biome: 'abyss',
    objective: 'ผสานจังหวะข้ามซากวิหารลอยฟ้า กำจัดผู้เฝ้าเงามืดทั้ง 5 ตน',
    stageHints: [
      'ในห้วงรัตติกาลวิญญาณเงามีพลังมากขึ้น ใช้พลังธาตุที่ตรงกับแกนกลางเพื่อประหยัดเวลา',
      'แท่นหินลอยกลางเหวเชื่อมต่อกันเป็นจังหวะ รอให้เพื่อนกระโดดตามมาพร้อมกัน',
      'เห็ดเด้งหน้าวิหารส่งขึ้นชั้นบนได้โดยตรง',
    ],
    width: 3800,
    height: 1020,
    spawns: {
      sola: { x: 120, y: 730 },
      luna: { x: 210, y: 730 },
    },
    waterfalls: [
      { id: 's8-wf1', x: 750, y: 80, w: 190, h: 940 },
      { id: 's8-wf2', x: 1910, y: 80, w: 205, h: 940 },
      { id: 's8-wf3', x: 3000, y: 80, w: 185, h: 940 },
    ],
    platforms: [
      { id: 's8-p0', x: 0, y: 780, w: 600, h: 240, kind: 'sanctuary' },
      { id: 's8-p1', x: 1020, y: 740, w: 720, h: 280, kind: 'sanctuary' },
      { id: 's8-arch1', x: 1255, y: 0, w: 165, h: 560, kind: 'stone' },
      { id: 's8-p2', x: 2070, y: 720, w: 720, h: 300, kind: 'sanctuary' },
      { id: 's8-p2-hi', x: 2290, y: 525, w: 230, h: 28, kind: 'sanctuary' },
      { id: 's8-p3', x: 3170, y: 660, w: 630, h: 360, kind: 'sanctuary' },
      { id: 's8-p3-hi', x: 3190, y: 465, w: 200, h: 28, kind: 'sanctuary' },
      { id: 's8-gate-pillar', x: 3420, y: 0, w: 145, h: 450, kind: 'stone' },
    ],
    movingPlatforms: [
      { id: 'mp-s8-1', x: 740, y: 755, w: 145, h: 26, dx: 125, dy: 0, speed: 1.15, phase: 0 },
      { id: 'mp-s8-2', x: 2910, y: 690, w: 145, h: 26, dx: 110, dy: 0, speed: 1.18, phase: 1.2 },
    ],
    mushrooms: [
      { id: 'mush-s8-1', x: 2210, y: 720, r: 28 },
      { id: 'mush-s8-2', x: 3380, y: 660, r: 28 },
    ],
    briars: [
      { id: 'briar-s8-1', x: 1315, y: 560, w: 48, h: 180 },
    ],
    totems: [
      { id: 'totem-s8-moon1', kind: 'lunar', x: 1685, y: 575, linksTo: 'bridge-s8-1' },
      { id: 'totem-s8-sun-bless', kind: 'solar', x: 2405, y: 467, linksTo: 'blessing' },
      { id: 'totem-s8-sun1', kind: 'solar', x: 3260, y: 602, linksTo: 'gate-s8' },
      { id: 'totem-s8-moon2', kind: 'lunar', x: 3290, y: 405, linksTo: 'gate-s8' },
    ],
    bridges: [
      { id: 'bridge-s8-1', x: 1730, y: 730, w: 350, h: 24, requiresTotemId: 'totem-s8-moon1' },
    ],
    gates: [
      {
        id: 'gate-s8',
        x: 3465,
        y: 450,
        w: 54,
        h: 210,
        requiresTotemIds: ['totem-s8-sun1', 'totem-s8-moon2'],
      },
    ],
    hazards: [
      { id: 'abyss-s8', x: -200, y: 990, w: 4200, h: 120, kind: 'abyss' },
    ],
    shards: [
      { id: 's8-s1', x: 360, y: 730 },
      { id: 's8-s2', x: 750, y: 685 },
      { id: 's8-s3', x: 890, y: 685 },
      { id: 's8-s4', x: 1140, y: 690 },
      { id: 's8-s5', x: 1520, y: 690 },
      { id: 's8-s6', x: 1835, y: 680 },
      { id: 's8-s7', x: 1965, y: 680 },
      { id: 's8-s8', x: 2345, y: 475 },
      { id: 's8-s9', x: 2470, y: 475 },
      { id: 's8-s10', x: 2635, y: 670 },
      { id: 's8-s11', x: 2915, y: 620 },
      { id: 's8-s12', x: 3250, y: 415 },
      { id: 's8-s13', x: 3345, y: 415 },
      { id: 's8-s14', x: 3610, y: 610 },
    ],
    checkpoints: [
      { id: 's8-cp1', x: 1075, y: 740 },
      { id: 's8-cp2', x: 2130, y: 720 },
    ],
    enemies: [
      { id: 's8-e1', x: 420, y: 730, patrolMinX: 280, patrolMaxX: 540, affinity: 'solar', hp: 58 },
      { id: 's8-e2', x: 1180, y: 690, patrolMinX: 1060, patrolMaxX: 1280, affinity: 'lunar', hp: 58 },
      { id: 's8-e3', x: 1530, y: 690, patrolMinX: 1410, patrolMaxX: 1680, affinity: 'solar', hp: 60 },
      { id: 's8-e4', x: 2560, y: 670, patrolMinX: 2350, patrolMaxX: 2740, affinity: 'lunar', hp: 62 },
      { id: 's8-e5', x: 3310, y: 610, patrolMinX: 3210, patrolMaxX: 3425, affinity: 'solar', hp: 62 },
    ],
    portal: {
      x: 3680,
      y: 590,
      requiresGateId: 'gate-s8',
    },
    hints: [
      { x: 520, text: 'ข้ามแท่นวิหารลอยฟ้าไปกำจัดภูตเงาและเผาเถาวัลย์ด้านหน้า' },
      { x: 2150, text: 'บนแท่นเห็ดมีเสาตะวันให้ฟื้นฟูเลือดทั้งคู่ก่อนลุยช่วงสุดท้าย!' },
      { x: 3180, text: 'จุดเสาทั้งสองด้านเปิดประตูสู่ทางเดินแห่งสุริยุปราคา' },
    ],
  },

  // =========================================================================
  // STAGE 9 (ACT 8): ECLIPSE CAUSEWAY (Biome: abyss)
  // =========================================================================
  {
    id: 8,
    stageNumber: 9,
    name: 'Eclipse Causeway',
    thaiName: 'ทางเดินแห่งสุริยุปราคา',
    subtitle: 'ด่าน 9/10 — บททดสอบสุดท้ายก่อนเข้าสู่วิหารบอส',
    biome: 'abyss',
    objective: 'ร่วมมือปลดผนึก 3 เสา (ตะวัน 2 + จันทรา 1) เปิดมหาประตูสู่วิหารสุริยุปราคา',
    stageHints: [
      'ประตูสุดท้ายของด่านนี้ใช้เสาทั้งหมด 3 ต้น: เสาตะวัน 2 ต้น (บนซ้าย-ล่างขวา) และผลึกจันทรา 1 ต้น!',
      'ระหว่างทางมีจุดเติมพลังจากเสาตะวันทั้งช่วงกลางและก่อนถึงประตู',
      'ผ่านด่านนี้แล้วจะเป็นศึกตัดสินกับบอสใหญ่ในด่าน 10 เตรียมพลังให้เต็ม!',
    ],
    width: 3900,
    height: 1040,
    spawns: {
      sola: { x: 120, y: 740 },
      luna: { x: 210, y: 740 },
    },
    waterfalls: [
      { id: 's9-wf1', x: 960, y: 80, w: 205, h: 960 },
      { id: 's9-wf2', x: 2210, y: 80, w: 205, h: 960 },
      { id: 's9-wf3', x: 3060, y: 80, w: 190, h: 960 },
    ],
    platforms: [
      { id: 's9-p0', x: 0, y: 790, w: 880, h: 250, kind: 'sanctuary' },
      { id: 's9-arch0', x: 430, y: 0, w: 160, h: 610, kind: 'stone' },
      { id: 's9-p1', x: 1220, y: 750, w: 820, h: 290, kind: 'sanctuary' },
      { id: 's9-p1-hi', x: 1470, y: 560, w: 260, h: 28, kind: 'sanctuary' },
      { id: 's9-p2', x: 2340, y: 580, w: 620, h: 460, kind: 'sanctuary' },
      { id: 's9-arch2', x: 2560, y: 0, w: 160, h: 400, kind: 'stone' },
      { id: 's9-p3', x: 3070, y: 650, w: 830, h: 390, kind: 'sanctuary' },
      { id: 's9-p3-left-hi', x: 3095, y: 455, w: 175, h: 28, kind: 'sanctuary' },
      { id: 's9-p3-right-hi', x: 3325, y: 455, w: 175, h: 28, kind: 'sanctuary' },
      { id: 's9-gate-pillar', x: 3535, y: 0, w: 145, h: 440, kind: 'stone' },
    ],
    movingPlatforms: [
      { id: 'mp-s9-1', x: 2145, y: 665, w: 145, h: 26, dx: 0, dy: -110, speed: 1.2, phase: 0.3 },
    ],
    mushrooms: [
      { id: 'mush-s9-1', x: 1410, y: 750, r: 28 },
      { id: 'mush-s9-2', x: 3295, y: 650, r: 28 },
    ],
    briars: [
      { id: 'briar-s9-1', x: 485, y: 610, w: 48, h: 180 },
      { id: 'briar-s9-2', x: 2615, y: 400, w: 48, h: 180 },
    ],
    totems: [
      { id: 'totem-s9-moon1', kind: 'lunar', x: 820, y: 615, linksTo: 'bridge-s9-1' },
      { id: 'totem-s9-bless1', kind: 'solar', x: 1600, y: 502, linksTo: 'blessing' },
      { id: 'totem-s9-sun1', kind: 'solar', x: 3180, y: 397, linksTo: 'gate-s9' },
      { id: 'totem-s9-moon2', kind: 'lunar', x: 3410, y: 395, linksTo: 'gate-s9' },
      { id: 'totem-s9-sun2', kind: 'solar', x: 3455, y: 592, linksTo: 'gate-s9' },
    ],
    bridges: [
      { id: 'bridge-s9-1', x: 870, y: 765, w: 360, h: 24, requiresTotemId: 'totem-s9-moon1' },
    ],
    gates: [
      {
        id: 'gate-s9',
        x: 3580,
        y: 440,
        w: 54,
        h: 210,
        requiresTotemIds: ['totem-s9-sun1', 'totem-s9-moon2', 'totem-s9-sun2'],
      },
    ],
    hazards: [
      { id: 'abyss-s9', x: -200, y: 1010, w: 4300, h: 120, kind: 'abyss' },
    ],
    shards: [
      { id: 's9-s1', x: 320, y: 740 },
      { id: 's9-s2', x: 675, y: 740 },
      { id: 's9-s3', x: 990, y: 715 },
      { id: 's9-s4', x: 1110, y: 715 },
      { id: 's9-s5', x: 1525, y: 510 },
      { id: 's9-s6', x: 1675, y: 510 },
      { id: 's9-s7', x: 1850, y: 700 },
      { id: 's9-s8', x: 2215, y: 520 },
      { id: 's9-s9', x: 2450, y: 530 },
      { id: 's9-s10', x: 2770, y: 530 },
      { id: 's9-s11', x: 2890, y: 530 },
      { id: 's9-s12', x: 3145, y: 405 },
      { id: 's9-s13', x: 3220, y: 405 },
      { id: 's9-s14', x: 3375, y: 405 },
      { id: 's9-s15', x: 3450, y: 405 },
      { id: 's9-s16', x: 3710, y: 600 },
    ],
    checkpoints: [
      { id: 's9-cp1', x: 1275, y: 750 },
      { id: 's9-cp2', x: 2390, y: 580 },
    ],
    enemies: [
      { id: 's9-e1', x: 685, y: 740, patrolMinX: 575, patrolMaxX: 785, affinity: 'lunar', hp: 62 },
      { id: 's9-e2', x: 1680, y: 700, patrolMinX: 1520, patrolMaxX: 1960, affinity: 'solar', hp: 64 },
      { id: 's9-e3', x: 1880, y: 700, patrolMinX: 1580, patrolMaxX: 1985, affinity: 'lunar', hp: 64 },
      { id: 's9-e4', x: 2455, y: 530, patrolMinX: 2380, patrolMaxX: 2560, affinity: 'solar', hp: 64 },
      { id: 's9-e5', x: 2800, y: 530, patrolMinX: 2705, patrolMaxX: 2920, affinity: 'lunar', hp: 64 },
    ],
    portal: {
      x: 3785,
      y: 580,
      requiresGateId: 'gate-s9',
    },
    hints: [
      { x: 360, text: 'SOLA เผาเถาวัลย์เงา แล้วให้ LUNA จุดผลึกสีฟ้าเปิดสะพานยาว!' },
      { x: 2100, text: 'ขึ้นลิฟต์แสงสู่ทางเดินวิหารบน เตรียมปะทะผู้คุ้มกันชุดสุดท้าย' },
      { x: 3120, text: 'ปลดผนึก 3 เสา (ตะวัน 2 + จันทรา 1) เพื่อเข้าสู่ด่านสุดท้าย ด่าน 10!' },
    ],
  },

  // =========================================================================
  // STAGE 10 (ACT 9): SANCTUARY OF ECLIPSE — FINAL BOSS (Biome: sanctuary)
  // =========================================================================
  {
    id: 9,
    stageNumber: 10,
    name: 'Sanctuary of Eclipse',
    thaiName: 'วิหารสุริยุปราคา',
    subtitle: 'ด่าน 10/10 — ศึกร่วมใจพิชิตอัมบรา นอคทิส',
    biome: 'sanctuary',
    objective: 'ร่วมใจปราบบอสใหญ่ "อัมบรา นอคทิส" คืนแสงสว่างแก่ผืนป่า!',
    stageHints: [
      'สีแกนกลางของบอสบอกจุดอ่อน: สีทองแพ้ SOLA, สีฟ้าแพ้ LUNA (ยิงตรงธาตุแรงขึ้น 1.45x)',
      'บอสจะกางเกราะสุริยุปราคา 2 ครั้ง (เลือด 66% และ 33%): ให้ SOLA จุดเสาซ้าย และ LUNA จุดผลึกขวาพร้อมกัน!',
      'เมื่อเกราะแตก บอสจะมึนงง 4.5 วินาที รีบระดมยิงพลังทั้งคู่ และกด "ผสาน" เพื่อฟื้นเลือด!',
    ],
    width: 1700,
    height: 950,
    spawns: {
      sola: { x: 240, y: 730 },
      luna: { x: 340, y: 730 },
    },
    waterfalls: [
      { id: 's-wf1', x: 185, y: 80, w: 150, h: 870 },
      { id: 's-wf2', x: 1365, y: 80, w: 150, h: 870 },
    ],
    platforms: [
      { id: 's_floor', x: 0, y: 780, w: 1700, h: 170, kind: 'sanctuary' },
      { id: 's_left_low', x: 160, y: 670, w: 240, h: 28, kind: 'sanctuary' },
      { id: 's_right_low', x: 1300, y: 670, w: 240, h: 28, kind: 'sanctuary' },
      { id: 's_left_high', x: 340, y: 490, w: 240, h: 28, kind: 'sanctuary' },
      { id: 's_right_high', x: 1120, y: 490, w: 240, h: 28, kind: 'sanctuary' },
      { id: 's_center', x: 710, y: 575, w: 280, h: 28, kind: 'sanctuary' },
    ],
    movingPlatforms: [],
    mushrooms: [
      { id: 'mush-5', x: 110, y: 780, r: 28 },
      { id: 'mush-6', x: 1590, y: 780, r: 28 },
    ],
    briars: [],
    totems: [
      { id: 'boss-totem-sun', kind: 'solar', x: 425, y: 432, linksTo: 'boss-shield', bossTotem: true },
      { id: 'boss-totem-moon', kind: 'lunar', x: 1275, y: 432, linksTo: 'boss-shield', bossTotem: true },
    ],
    bridges: [],
    gates: [],
    hazards: [
      { id: 'abyss-2', x: -200, y: 920, w: 2100, h: 120, kind: 'abyss' },
    ],
    shards: [
      { id: 'a2-s1', x: 240, y: 620 },
      { id: 'a2-s2', x: 320, y: 620 },
      { id: 'a2-s3', x: 425, y: 440 },
      { id: 'a2-s4', x: 500, y: 440 },
      { id: 'a2-s5', x: 780, y: 525 },
      { id: 'a2-s6', x: 920, y: 525 },
      { id: 'a2-s7', x: 1200, y: 440 },
      { id: 'a2-s8', x: 1275, y: 440 },
      { id: 'a2-s9', x: 1380, y: 620 },
      { id: 'a2-s10', x: 1460, y: 620 },
    ],
    checkpoints: [
      { id: 'a2-cp1', x: 850, y: 780 },
    ],
    enemies: [],
    boss: {
      name: 'Umbra Noctis',
      thaiName: 'อัมบรา นอคทิส — ผู้พิทักษ์สุริยุปราคา',
      x: 850,
      y: 290,
      maxHp: 340,
      style: 'moth',
      isMiniBoss: false,
      shieldThresholds: [0.66, 0.33],
      sunTotemId: 'boss-totem-sun',
      moonTotemId: 'boss-totem-moon',
    },
    portal: {
      x: 850,
      y: 710,
      requiresBossDefeated: true,
    },
    hints: [
      { x: 260, text: 'สังเกตสีแกนกลางของบอส: สีทองแพ้พลังตะวัน สีฟ้าแพ้พลังจันทรา!' },
      { x: 700, text: 'เมื่อบอสกางเกราะสุริยุปราคา ให้จุดทั้งเสาตะวัน (ซ้าย) และผลึกจันทรา (ขวา) พร้อมกัน!' },
    ],
  },
];

/**
 * Deterministic evaluation of a moving platform's position & delta at serverTime (seconds).
 */
export function evaluateMovingPlatform(mp, timeSec) {
  const angle = timeSec * mp.speed + (mp.phase || 0);
  const s = Math.sin(angle);
  return {
    x: mp.x + mp.dx * s,
    y: mp.y + mp.dy * s,
    w: mp.w,
    h: mp.h,
  };
}
