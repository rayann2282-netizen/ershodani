// اختبارات القارئ بنص «وهمي» بنفس شكل ملفات البوابة (الأماكن x و y، والأرقام العربية،
// وأشكال الحروف ﻧﺎﻝ). الأسماء والدرجات مخترعة — ما فيه بيانات طالب حقيقي هنا.
import { describe, it, expect } from 'vitest'
import { parseTranscript } from './parseTranscript.js'
import { parseReport, parseRule } from './parseReport.js'
import { detectKind } from './rows.js'
import { courseKey } from './normalize.js'

const item = (str, x, y) => ({ str, x, y })

const transcriptPages = [
  {
    items: [
      item('ﺳﺠﻞ ﺍﻟﻄﺎﻟﺐ ﺍﻷﻛﺎﺩﻳﻤﻲ', 350, 540),
      item('ﻓﻴﺼﻞ ﺑﻦ ﺧﺎﻟﺪ ﺍﻟﻌﺘﻴﺒﻲ', 446, 520),
      // الجدول اليمين: فصل أول
      item('- - ﺍﻟﻔﺼﻞ ﺍﻟﺪﺭﺍﺳﻲ ﺍﻟﺜﺎﻧﻲ ١٤٤٦ ﻫـ - ﺍﻧﺘﻈﺎﻡ - ﻧﻈﻢ ﺍﻟﻤﻌﻠﻮﻣﺎﺕ- -', 610, 473),
      item('ﻧﺎﻝ١١٣٠', 765, 437), item('ﻫﻨﺪﺳﺔ ﺍﻟﻤﺘﻄﻠﺒﺎﺕ', 650, 437), item('٣', 578, 437), item('١٢', 526, 437), item('ﺏ', 480, 438),
      item('ﻋﺎﻝ١٢٤١', 762, 423), item('ﺍﻟﺒﺮﻣﺠﺔ ﺍﻟﺸﻴﺌﻴﺔ', 650, 423), item('٤', 578, 423), item('٢', 526, 423), item('ﻫـ', 480, 424),
      item('ﺍﻟﺘﺮﺍﻛﻤﻲ', 758, 338), item('١٥', 692, 338), item('١٥', 626, 338), item('٥٢٫٠٠', 538, 339), item('٣٫٤٧', 482, 338),
      // الجدول اليسار: فصل بعده (أعاد البرمجة الشيئية ونجح)
      item('- - ﺍﻟﻔﺼﻞ ﺍﻟﺪﺭﺍﺳﻲ ﺍﻷﻭﻝ ١٤٤٧ ﻫـ - ﺍﻧﺘﻈﺎﻡ - ﻧﻈﻢ ﺍﻟﻤﻌﻠﻮﻣﺎﺕ- -', 204, 473),
      item('ﻋﺎﻝ١٢٤١', 359, 437), item('ﺍﻟﺒﺮﻣﺠﺔ ﺍﻟﺸﻴﺌﻴﺔ', 260, 437), item('٤', 174, 437), item('١٤', 125, 437), item('ﺃ', 77, 438),
      item('ﻧﺎﻝ١٢٠٠', 359, 423), item('ﻛﻔﺎءﺍﺕ ﺍﻹﺩﺍﺭﺓ', 260, 423), item('٢', 174, 423), item('٢', 125, 423), item('ﻫـ', 77, 424),
      item('ﻧﺎﻝ١٢٣٥', 359, 410), item('ﺗﺤﻠﻴﻞ ﻭﺗﺼﻤﻴﻢ ﺍﻟﻨﻈﻢ', 260, 410), item('٣', 174, 410), item('ﻡ', 77, 411),
      item('ﺍﻟﺘﺮﺍﻛﻤﻲ', 352, 324), item('٢٩', 286, 324), item('٢٩', 220, 324), item('١٠٠٫٥٠', 128, 325), item('٣٫٤٧', 77, 324),
    ],
  },
]

const reportPages = [
  {
    items: [
      item('ﻛﺸﻒ ﺑﺎﻟﻤﻘﺮﺭﺍﺕ ﺍﻟﻤﺘﺒﻘﻴﺔ ﻋﻠﻰ ﺍﻟﻄﺎﻟﺐ', 237, 759),
      item('ﻭﺻﻒ ﺍﻟﻤﺠﻤﻮﻋﺔ', 495, 662), item('ﻧﻈﻢ ﺍﻟﻤﻌﻠﻮﻣﺎﺕ ﻑ٤', 428, 662),
      item('ﺣﺴﺐ', 546, 626), item('١٢٥٠', 475, 626), item('ﻣﺒﺎﺩﺉ ﺍﻟﻤﺤﺎﺳﺒﺔ', 367, 626), item('٣', 189, 626), item('ﻏﻴﺮ ﻣﺠﺘﺎﺯ', 82, 626),
      item('ﻧﺎﻝ', 553, 612), item('١٢٤١', 475, 612), item('ﻣﺒﺎﺩﺉ ﺍﺩﺍﺭﺓ ﺍﻟﻤﺸﺎﺭﻳﻊ', 381, 612), item('٣', 189, 612), item('ﻏﻴﺮ ﻣﺠﺘﺎﺯ', 82, 612),
      item('ﻭﺻﻒ ﺍﻟﻤﺠﻤﻮﻋﺔ', 495, 563), item('ﻧﻈﻢ ﺍﻟﻤﻌﻠﻮﻣﺎﺕ ﻑ٥', 428, 563),
      item('ﻋﺎﻝ', 553, 527), item('١٣٢٢', 475, 527), item('ﺃﻧﻈﻤﺔ ﺍﻟﺘﺸﻐﻴﻞ', 405, 527), item('٤', 189, 527), item('ﻏﻴﺮ ﻣﺠﺘﺎﺯ', 82, 527),
      item('ﻭﺻﻒ ﺍﻟﻤﺠﻤﻮﻋﺔ', 495, 153), item('ﻣﺘﻄﻠﺐ ﺟﺎﻣﻌﻲ ﺍﺟﺒﺎﺭﻱ', 420, 153), item('ﺗﺠﺎﻭﺯ ﻣﻘﺮﺭﻳﻦ ﻣﻦ ﺍﻟﻤﺠﻤﻮﻋﺔ', 164, 152),
      item('ﻗﺮﺍ', 545, 117), item('١٠٠١', 478, 117), item('ﺍﻟﻘﺮﺁﻥ ﺍﻟﻜﺮﻳﻢ', 409, 117), item('٢', 191, 117), item('ﻏﻴﺮ ﻣﺠﺘﺎﺯ', 82, 117),
    ],
  },
  {
    items: [
      item('ﻭﺻﻒ ﺍﻟﻤﺠﻤﻮﻋﺔ', 495, 700), item('ﺍﻟﻤﻬﺎﺭﺍﺕ ﺍﻟﻤﻬﻨﻴﺔ ﻭﺳﻮﻕ ﺍﻟﻌﻤﻞ', 420, 700), item('ﺗﺠﺎﻭﺯ ﻣﻘﺮﺭﻳﻦ ﻣﻦ ﺍﻟﻤﺠﻤﻮﻋﺔ', 164, 699),
      item('ﺩﺍﺭ', 550, 660), item('١٠٠١', 478, 660), item('ﺍﻻﺑﺘﻜﺎﺭ ﻭﺭﻳﺎﺩﺓ ﺍﻷﻋﻤﺎﻝ', 390, 660), item('٢', 191, 660), item('ﻏﻴﺮ ﻣﺠﺘﺎﺯ', 82, 660),
      item('ﻣﺎﻝ', 550, 646), item('١٠٠١', 478, 646), item('ﻣﻬﺎﺭﺍﺕ ﺍﻟﺘﺨﻄﻴﻂ ﺍﻟﻤﺎﻟﻲ', 390, 646), item('٢', 191, 646), item('ﻣﺠﺘﺎﺯ', 82, 646),
      item('ﻭﺻﻒ ﺍﻟﻤﺠﻤﻮﻋﺔ', 495, 500), item('ﻣﻘﺮﺭﺍﺕ ﺣﺮﺓ ﻟﻜﻠﻴﺔ ﺍﻟﺤﺎﺳﺐ', 420, 500), item('ﺗﺠﺎﻭﺯ ٦ ﺳﺎﻋﺎﺕ ﻣﻦ ﺍﻟﻤﺠﻤﻮﻋﺔ', 164, 499),
      item('ﺧﺪﻡ', 550, 460), item('١٢٣١', 478, 460), item('ﻗﻴﺎﺱ ﺗﺠﺮﺑﺔ ﺍﻟﻌﻤﻴﻞ', 390, 460), item('٢', 191, 460), item('ﻣﺠﺘﺎﺯ', 82, 460),
      item('ﻋﻠﻖ', 550, 446), item('١٣٠٨', 478, 446), item('ﺍﻟﺮﺃﻱ ﺍﻟﻌﺎﻡ', 390, 446), item('٢', 191, 446), item('ﻏﻴﺮ ﻣﺠﺘﺎﺯ', 82, 446),
      // مجموعة تبدأ آخر الصفحة وتكمل في اللي بعدها
      item('ﻭﺻﻒ ﺍﻟﻤﺠﻤﻮﻋﺔ', 495, 80), item('ﻗﻴﻢ ﺗﺎﺭﻳﺨﻴﺔ ﻭﻭﻃﻨﻴﺔ ﻭﺍﺟﺘﻤﺎﻋﻴﺔ', 420, 80), item('ﺗﺠﺎﻭﺯ ﻣﻘﺮﺭﻳﻦ ﻣﻦ ﺍﻟﻤﺠﻤﻮﻋﺔ', 164, 79),
    ],
  },
  {
    items: [
      item('ﻭﺻﻒ ﺍﻟﻤﺠﻤﻮﻋﺔ', 495, 700), item('ﻗﻴﻢ ﺗﺎﺭﻳﺨﻴﺔ ﻭﻭﻃﻨﻴﺔ ﻭﺍﺟﺘﻤﺎﻋﻴﺔ', 420, 700), item('ﺗﺠﺎﻭﺯ ﻣﻘﺮﺭﻳﻦ ﻣﻦ ﺍﻟﻤﺠﻤﻮﻋﺔ', 164, 699),
      item('ﺗﺮﺥ', 550, 660), item('١٠٠١', 478, 660), item('ﺩﺭﺍﺳﺎﺕ ﻓﻲ ﺍﻟﺴﻴﺮﺓ ﺍﻟﻨﺒﻮﻳﺔ', 390, 660), item('٢', 191, 660), item('ﻣﺠﺘﺎﺯ', 82, 660),
      item('ﺟﻐﺮ', 550, 646), item('١٠٠١', 478, 646), item('ﺍﻟﺒﻴﺌﺔ ﻭﺍﻟﺘﻨﻤﻴﺔ ﺍﻟﻤﺴﺘﺪﺍﻣﺔ', 390, 646), item('٢', 191, 646), item('ﻏﻴﺮ ﻣﺠﺘﺎﺯ', 82, 646),
    ],
  },
]

describe('detectKind', () => {
  it('knows each portal file from its title', () => {
    expect(detectKind(transcriptPages)).toBe('transcript')
    expect(detectKind(reportPages)).toBe('remaining_report')
    expect(detectKind([{ items: [item('فاتورة', 1, 1)] }])).toBe('unknown')
  })
})

describe('courseKey', () => {
  it('cleans presentation forms and Arabic digits, and finds the plan key', () => {
    expect(courseKey('ﻧﺎﻝ', '١٢٢٠')).toBe('نال 1220')
    expect(courseKey('ﻗﺮﺍ', '١٠٠١')).toBe('قرأ 1001') // «قرا» in the report = «قرأ» in the plan
  })
})

describe('parseTranscript', () => {
  const result = parseTranscript(transcriptPages)

  it('reads every course with its latest grade', () => {
    const byCourse = Object.fromEntries(result.transcript.map((t) => [t.course, t.grade]))
    expect(byCourse).toEqual({ 'نال 1130': 'ب', 'عال 1241': 'أ', 'نال 1200': 'هـ', 'نال 1235': 'م' })
  })

  it('reads the name of each course as written in the transcript', () => {
    const names = Object.fromEntries(result.transcript.map((t) => [t.course, t.name]))
    expect(names).toEqual({ 'نال 1130': 'هندسة المتطلبات', 'عال 1241': 'البرمجة الشيئية', 'نال 1200': 'كفاءات الإدارة', 'نال 1235': 'تحليل وتصميم النظم' })
  })

  it('reads the term of each course', () => {
    expect(result.transcript.find((t) => t.course === 'نال 1200').term).toBe('الفصل الأول 1447')
  })

  it('takes the GPA and hours from the latest cumulative row', () => {
    expect(result.summary).toEqual({ cumulativeGpa: 3.47, earnedHours: 29, passedCount: 2 })
  })
})

describe('parseReport', () => {
  const result = parseReport(reportPages)

  it('finds the next level and its remaining courses', () => {
    expect(result.currentLevel).toEqual({ level: 4, courses: ['حسب 1250', 'نال 1241'] })
    expect(result.remainingLevels).toEqual([
      { level: 4, courses: ['حسب 1250', 'نال 1241'] },
      { level: 5, courses: ['عال 1322'] },
    ])
  })

  it('finds the mandatory university courses not registered yet', () => {
    expect(result.mandatoryUniversity).toEqual(['قرأ 1001'])
  })

  it('reads requirement groups, including one split across two pages', () => {
    expect(result.groups.map(({ name, required, passed, options }) => ({ name, required, passed, options }))).toEqual([
      { name: 'المهارات المهنية وسوق العمل', required: 2, passed: 1, options: ['دار 1001'] },
      { name: 'مقررات حرة لكلية الحاسب', required: 3, passed: 1, options: ['علق 1308'] },
      { name: 'قيم تاريخية ووطنية واجتماعية', required: 2, passed: 1, options: ['جغر 1001'] },
    ])
    expect(result.groups[1].names['علق 1308']).toBe('الرأي العام')
  })
})

describe('parseRule', () => {
  it('reads course and hour rules', () => {
    expect(parseRule('تجاوز مقرر واحد من المجموعة')).toEqual({ type: 'courses', count: 1 })
    expect(parseRule('تجاوز مقررين من المجموعة')).toEqual({ type: 'courses', count: 2 })
    expect(parseRule('تجاوز 3 مقررات من المجموعة')).toEqual({ type: 'courses', count: 3 })
    expect(parseRule('تجاوز 6 ساعات من المجموعة')).toEqual({ type: 'hours', count: 6 })
  })
})
