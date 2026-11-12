import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import {
  createChallenge,
  listChallenges,
  getChallengeById,
  submitAnswer
} from '../src/services/play.service.js';
import { User, GameChallenge } from '../src/models/index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

async function runPlayGameTests() {
  console.log('================================================================');
  console.log('LOOPLY — PLAY GAMES REAL GAMEPLAY TEST SUITE');
  console.log('================================================================');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✓ Connected to MongoDB:', mongoose.connection.name);

  // Retrieve test users from synthetic seed
  const sophia = await User.findOne({ email: 'sophia.chen@looply.test' });
  const marcus = await User.findOne({ email: 'marcus.vance@looply.test' });
  const arjun = await User.findOne({ email: 'arjun.mehta@looply.test' });
  const julian = await User.findOne({ email: 'julian.alvarez@looply.test' });

  assert(sophia && marcus && arjun && julian, 'Test users retrieved from database');

  // Test 1: Who Knows Me (multi-question quiz)
  console.log('\n[TEST 1] Who Knows Me? Multi-Question Friendship Quiz');
  const wkmChallenge = await createChallenge({
    creatorId: sophia._id,
    gameType: 'who_knows_me',
    title: 'Test Quiz: Who Knows Me Best?',
    description: 'A 3-question test friendship quiz',
    gameData: {
      questions: [
        { question: 'Morning beverage?', options: ['Tea', 'Coffee', 'Juice'] },
        { question: 'Favorite pet?', options: ['Cat', 'Dog', 'Bird'] },
        { question: 'Preferred holiday?', options: ['Beach', 'Mountains', 'City'] }
      ]
    },
    answerKey: {
      q0: 1, // Coffee
      q1: 0, // Cat
      q2: 1  // Mountains
    }
  });

  assert(wkmChallenge.success, 'Created multi-question Who Knows Me challenge');
  const wkmId = wkmChallenge.challenge._id;

  // Unplayed user should not see hidden answerKey
  const beforePlay = await getChallengeById(wkmId, arjun._id);
  assert(beforePlay.challenge.answerKey === undefined, 'Hidden answerKey is omitted before playing');
  assert(!beforePlay.hasParticipated, 'User participation flag is false before playing');

  // Submit answers: 2 correct, 1 wrong
  const wkmSubmit = await submitAnswer(wkmId, arjun._id, {
    q0: 1, // correct
    q1: 0, // correct
    q2: 0  // wrong (beach instead of mountains)
  });

  assert(wkmSubmit.success, 'Successfully submitted Who Knows Me answers');
  assert(wkmSubmit.score === 2, `Score correctly calculated as 2/3 (got: ${wkmSubmit.score})`);
  assert(wkmSubmit.maxScore === 3, 'Max score correctly identified as 3');
  assert(wkmSubmit.correctAnswers?.q0 === 1, 'Debrief contains correct answers key');

  // Duplicate submission blocked
  const duplicateWkm = await submitAnswer(wkmId, arjun._id, { q0: 1, q1: 0, q2: 1 });
  assert(duplicateWkm.message.includes('already played'), 'Duplicate submission strictly prevented');

  // Post-play inspection reveals answers to player
  const afterPlay = await getChallengeById(wkmId, arjun._id);
  assert(afterPlay.hasParticipated, 'hasParticipated is true after playing');
  assert(afterPlay.userScore === 2, 'userScore recorded accurately in participation');
  assert(afterPlay.challenge.revealedAnswerKey?.q0 === 1, 'Player can view revealed answer key after submission');

  // Test 2: Two Truths and a Lie
  console.log('\n[TEST 2] Two Truths & A Lie');
  const ttlChallenge = await createChallenge({
    creatorId: marcus._id,
    gameType: 'two_truths_and_lie',
    title: 'Test: Spot the Lie',
    gameData: {
      prompt: 'Which statement is the lie?',
      statements: [
        'I built my first computer at age 12.',
        'I have run three marathons in Antarctica.',
        'I own over 40 vintage mechanical keyboards.'
      ],
      explanation: 'Statement #2 is the lie! I have never been to Antarctica.'
    },
    answerKey: {
      lieIndex: 1
    }
  });

  assert(ttlChallenge.success, 'Created Two Truths & A Lie challenge');
  const ttlId = ttlChallenge.challenge._id;

  // Submit incorrect guess (picked index 0)
  const wrongTtl = await submitAnswer(ttlId, arjun._id, { lieIndex: 0 });
  assert(wrongTtl.score === 0, 'Incorrect lie guess returns score 0');
  assert(wrongTtl.correctLieIndex === 1, 'Debrief reveals true lieIndex');
  assert(wrongTtl.explanation.includes('Antarctica'), 'Debrief provides creator explanation');

  // Submit correct guess from different user (picked index 1)
  const correctTtl = await submitAnswer(ttlId, julian._id, { lieIndex: 1 });
  assert(correctTtl.score === 1, 'Correct lie guess returns score 1 (perfect score)');

  // Test 3: Emoji Riddles
  console.log('\n[TEST 3] Emoji Riddles Decoding');
  const emojiChallenge = await createChallenge({
    creatorId: sophia._id,
    gameType: 'emoji_challenge',
    title: 'Test: Movie Emoji',
    gameData: {
      emojis: '⚡ 👓 🧙‍♂️ 🏰',
      hint: 'The boy who lived'
    },
    answerKey: {
      answer: 'Harry Potter'
    }
  });

  const emojiId = emojiChallenge.challenge._id;

  // Submit with slight case & article variation: "harry potter"
  const emojiResult = await submitAnswer(emojiId, arjun._id, { answer: 'harry potter' });
  assert(emojiResult.score === 1, 'Normalized string matching accepts case-insensitive answer');
  assert(emojiResult.correctAnswer === 'Harry Potter', 'Reveals formatted correct answer');

  // Test 4: Picture Mystery
  console.log('\n[TEST 4] Picture Mystery');
  const picChallenge = await createChallenge({
    creatorId: marcus._id,
    gameType: 'picture_mystery',
    title: 'Test: Hidden Landmark',
    gameData: {
      imageUrl: 'https://images.unsplash.com/photo-1543731068-7e0f5beff43a',
      hint: 'Iconic suspension bridge in California'
    },
    answerKey: {
      answer: 'Golden Gate Bridge'
    }
  });

  const picId = picChallenge.challenge._id;
  const picResult = await submitAnswer(picId, arjun._id, { answer: 'The Golden Gate Bridge!' });
  assert(picResult.score === 1, 'Normalized matching handles leading "The" and punctuation');

  // Cleanup test records created during this test
  await GameChallenge.deleteMany({ _id: { $in: [wkmId, ttlId, emojiId, picId] } });
  console.log('✓ Cleaned up test game records');

  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(`PLAY GAME RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runPlayGameTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

