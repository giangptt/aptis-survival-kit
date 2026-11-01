/* Bài viết người học GIẢ LẬP để kiểm tra bộ chấm Writing offline.
 *
 * LƯU Ý QUAN TRỌNG: các bài này do người phát triển tự viết, mô phỏng lỗi điển hình của người học Việt ở từng trình độ.
 * Nhãn `level` là TRÌNH ĐỘ MONG ĐỢI do người viết gán, KHÔNG phải kết quả chấm của giáo viên. Vì vậy chúng chỉ chứng minh
 * bộ chấm phân biệt được mức độ và không chấm thấp bài tốt; chưa chứng minh độ khớp với giám khảo Aptis thật.
 * Muốn hiệu chỉnh thật: thay/bổ sung bằng bài đã được giáo viên chấm (xem docs/12-writing-assessment.md).
 */
module.exports = [
  /* ---------------- Task 1 ---------------- */
  { id: 'a2-task1', ex: 'w1-1', level: 'A2', parts: ['Tran Van Nam', 'i work in company', 'speaking', 'I want meet people', 'every week', 'I learn English two year. I want speak more good. I think club is help me.'] },
  { id: 'b1-task1', ex: 'w1-1', level: 'B1', parts: ['Tran Van Nam', "I'm a sales assistant", 'My speaking', 'To practise English with other people', 'Every Wednesday evening', 'I have learned English for two years at a language centre, but I have few chances to speak. I hope this club will help me to become more confident.'] },

  /* ---------------- Task 2 ---------------- */
  {
    id: 'a2-task2',
    ex: 'w2-1',
    level: 'A2',
    parts: [
      'Hi Maya. I read in the evening. I read in my bed because it is quiet. I like reading very much and I read every day for one hour.',
      "I like paper book. I don't like e-book because my eyes hurt. Paper book is good and cheap. You should buy paper book for your birthday.",
      'I want read a love story. Love story is very good and everybody like it. I think we read it next time. Please choose love story.',
    ],
  },
  {
    id: 'b1-task2',
    ex: 'w2-1',
    level: 'B1',
    parts: [
      "Hi Maya! I usually read in the evening after dinner, because during the day I am too busy with my work. Sometimes I read on the bus too, but it is noisy so I can't concentrate very well.",
      'I prefer paper books because I like the smell and the feeling of turning pages. However, e-books are cheaper and lighter, so they are better for travelling. I think you should buy the one that you will use more.',
      'I would like to read a mystery novel next, because it is exciting and we can discuss who the killer is. Another idea is a famous classic, but some of them are quite long and difficult for me.',
    ],
  },
  {
    id: 'b2-task2',
    ex: 'w2-1',
    level: 'B2',
    parts: [
      "Hi Maya! I tend to read on my commute, since it's the only time I'm not interrupted. On weekends I also curl up with a book after lunch, although I often doze off within half an hour.",
      "Honestly, I'd go for an e-book if you travel a lot, because you can carry a whole library in your bag. Nevertheless, I still buy paper copies of my favourites, as they feel more special as gifts.",
      'How about a thriller? It would keep everyone guessing, and we could argue about the ending afterwards. Alternatively, we might choose a classic novel that most of us have never got round to reading.',
    ],
  },

  /* ---------------- Task 3 ---------------- */
  { id: 'a2-task3', ex: 'w3-1', level: 'A2', parts: ['hi jack\nthank you for your email. I can come saturday. I bring food and water. i like hiking very much. see you.\nLan'] },
  { id: 'b1-task3', ex: 'w3-1', level: 'B1', parts: ["Hi Jack,\n\nThanks for your message. I would like to come with you on Saturday because I haven't go hiking for a long time. I will bring some sandwiches and fruit. What time we should meet?\n\nSee you soon,\nLinh"] },
  { id: 'b2-task3', ex: 'w3-1', level: 'B2', parts: ["Hi Jack,\n\nThanks for the invitation! I'd love to come, although I haven't been hiking since last spring, so please pick a gentle route. I'll bring sandwiches, fruit and plenty of water. Shall we meet at the station at seven?\n\nSpeak soon,\nLinh"] },
  { id: 'a2-task3b', ex: 'w3-2', level: 'A2', parts: ['Hi Sophie\nYou come my city is good. You can go to the lake and old town. Hotel near centre is good. Please tell me day you come.\nHoa'] },
  { id: 'b1-task3b', ex: 'w3-2', level: 'B1', parts: ["Hi Sophie,\n\nI am happy that you will visit my city. You can see the old town and the lake, they are very beautiful. I think you should stay in a hotel near the centre because it's convenient. Tell me when you arrive and I will pick you up.\n\nBest wishes,\nHoa"] },

  /* ---------------- Task 4 ---------------- */
  { id: 'a2-task4', ex: 'w4-1', level: 'A2', parts: ['Dear manager,\nI buy a coffee machine in your shop. It come late and it broken. I am very angry. Please give me my money back. i wait your answer.\nThanks\nNam'] },
  {
    id: 'b1-task4',
    ex: 'w4-1',
    level: 'B1',
    parts: [
      'Dear Sir or Madam,\n\nI am writing to complain about the coffee machine which I bought from your website last week. The delivery was late and the machine was broken when it arrived. I am very disappointed because I have paid a lot of money for it.\n\nI called your customer service two times but nobody answer my phone. This is not good service for a customer.\n\nI would like you to send me a new machine or return my money. Please reply me as soon as possible, because I need the machine for my family.\n\nI look forward to hear from you.\n\nYours faithfully,\nNam Tran',
    ],
  },
  {
    id: 'b2-task4',
    ex: 'w4-1',
    level: 'B2',
    parts: [
      'Dear Sir or Madam,\n\nI am writing to complain about a coffee machine that I ordered from your website three weeks ago.\n\nTo begin with, the parcel arrived ten days late, even though the website promised delivery within four working days. Furthermore, when I opened the box, I discovered that the glass jug was cracked, which made the machine unusable. I have attached photographs of the damage.\n\nI would therefore be grateful if you could either send me a replacement as soon as possible or refund the full price of £89. In addition, I would appreciate some compensation for the inconvenience I have suffered.\n\nI look forward to hearing from you.\n\nYours faithfully,\nPham Thu Ha',
    ],
  },
  {
    id: 'b1-task4b',
    ex: 'w4-3',
    level: 'B1',
    parts: [
      'Dear Mr Hughes,\n\nThank you for asking us about ideas to improve well-being. I want to give you some suggestions.\n\nFirst, I think the company should have a quiet room, where people can take a rest when they are tired. It will help us to work better in the afternoon. Second, we can start a walking group at lunch time. When people do some exercise, they feel more happy and healthy.\n\nI hope these ideas are useful for you. I am happy to help if you want.\n\nBest regards,\nMai',
    ],
  },
  { id: 'a2-task4b', ex: 'w4-3', level: 'A2', parts: ['Dear Mr Hughes,\nI have idea for company. We need coffee free and sofa for rest. Staff happy then work good. Please think about my idea.\nThank you\nMai'] },
];
