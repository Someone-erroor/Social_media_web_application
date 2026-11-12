import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import {
  User,
  Post,
  Comment,
  Like,
  GameChallenge,
  Circle,
  FeedHeist,
  MoodOrbitRoom
} from '../src/models/index.js';

const SHARED_PASSWORD = 'Password@123';

const SYNTHETIC_PERSONAS = [
  {
    email: 'elena.rostova@looply.test',
    fullName: 'Elena Rostova',
    bio: 'Chasing neon reflections, quiet Tokyo rain, and fleeting street moments through a 35mm prime. 📸',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    tags: ['photography', 'tokyo', 'street-art']
  },
  {
    email: 'marcus.vance@looply.test',
    fullName: 'Marcus Vance',
    bio: 'Indie game developer & pixel animator. Crafting tiny worlds with big heart. Currently prototyping a cozy puzzle adventure.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    tags: ['gamedev', 'pixelart', 'indiedev']
  },
  {
    email: 'sophia.chen@looply.test',
    fullName: 'Sophia Chen',
    bio: 'Specialty coffee roaster & stoneware ceramicist. Pour-overs, slow mornings, and warm clay on the wheel. ☕',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    tags: ['coffee', 'ceramics', 'slowliving']
  },
  {
    email: 'liam.o_connor@looply.test',
    fullName: "Liam O'Connor",
    bio: 'Mountain trail runner & alpine essayist. Always somewhere between the high ridgeline and a quiet notebook.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    tags: ['trailrunning', 'mountains', 'nature']
  },
  {
    email: 'maya.patel@looply.test',
    fullName: 'Maya Patel',
    bio: 'Concept illustrator & sci-fi worldbuilder. Visualizing neon flora, organic machinery, and gentle utopian futures. 🎨',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    tags: ['illustration', 'conceptart', 'scifi']
  },
  {
    email: 'julian.alvarez@looply.test',
    fullName: 'Julian Alvarez',
    bio: 'Philosophy graduate student & vinyl crate digger. Reading phenomenology, spinning 1960s jazz, and asking too many questions.',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    tags: ['philosophy', 'books', 'jazz']
  },
  {
    email: 'hannah.becker@looply.test',
    fullName: 'Hannah Becker',
    bio: 'Sourdough baker & balcony botanist. Fermenting grains, nurturing monsteras, and practicing the patient arts.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    tags: ['baking', 'plants', 'gardening']
  },
  {
    email: 'devon.brooks@looply.test',
    fullName: 'Devon Brooks',
    bio: 'Sound designer & ambient synthesizer composer. Collecting field recordings of rainfall, tape delays, and modular loops. 🎧',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    tags: ['ambient', 'music', 'sounddesign']
  },
  {
    email: 'clara.novak@looply.test',
    fullName: 'Clara Novak',
    bio: 'Architectural historian & secondhand book collector. Obsessed with brutalist concrete, hidden courtyards, and paperback dust jackets.',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    tags: ['architecture', 'books', 'history']
  },
  {
    email: 'arjun.mehta@looply.test',
    fullName: 'Arjun Mehta',
    bio: 'Distance runner & community youth coach. 26.2 miles at a time. Movement clears the mind; community builds the spirit.',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    tags: ['running', 'fitness', 'community']
  },
  {
    email: 'chloe.dubois@looply.test',
    fullName: 'Chloé Dubois',
    bio: 'Interface designer & typography enthusiast. Believer in quiet digital spaces, generous whitespace, and readable typography.',
    avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a171edd2521d?auto=format&fit=crop&w=400&q=80',
    tags: ['design', 'typography', 'ux']
  },
  {
    email: 'tariq.mansour@looply.test',
    fullName: 'Tariq Mansour',
    bio: 'Amateur astrophotographer & stargazer. Pointing telescopes at distant galaxies and marveling at cosmic deep time. 🌌',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    tags: ['astronomy', 'space', 'nightsky']
  },
  {
    email: 'nina.lindqvist@looply.test',
    fullName: 'Nina Lindqvist',
    bio: 'Nordic home cook & berry forager. Rye bread traditions, cloudberry jams, and honest meals shared around timber tables.',
    avatarUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=400&q=80',
    tags: ['cooking', 'nordic', 'foraging']
  },
  {
    email: 'samuel.kim@looply.test',
    fullName: 'Samuel Kim',
    bio: 'Custom keyboard builder & industrial design enthusiast. Lubing switches, milled aluminum cases, and desk ergonomics.',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    tags: ['keyboards', 'hardware', 'maker']
  },
  {
    email: 'zara.al-hassan@looply.test',
    fullName: 'Zara Al-Hassan',
    bio: 'Audio documentary producer & neighborhood storyteller. Capturing oral histories and overlooked melodies of everyday city life.',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
    tags: ['audio', 'storytelling', 'journalism']
  }
];

export async function seedSyntheticCommunity() {
  console.log('================================================================');
  console.log('LOOPLY — SYNTHETIC COMMUNITY & CONTENT REALISM SEED');
  console.log('================================================================');

  console.log('[1/7] Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✓ Connected to database:', mongoose.connection.name);

  const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 12);
  const userMap = new Map();

  // [2/7] Upsert 15 personas
  console.log('[2/7] Provisioning 15 realistic community members...');
  for (const p of SYNTHETIC_PERSONAS) {
    const user = await User.findOneAndUpdate(
      { email: p.email },
      {
        $set: {
          email: p.email,
          fullName: p.fullName,
          passwordHash,
          role: 'user',
          isEmailVerified: true,
          accountStatus: 'active',
          tokenVersion: 0,
          isPrivate: false,
          'profile.bio': p.bio,
          'profile.avatarUrl': p.avatarUrl,
          updatedAt: new Date()
        },
        $setOnInsert: {
          followers: [],
          following: [],
          followersCount: 0,
          followingCount: 0,
          blockedUsers: [],
          followRequests: [],
          sentFollowRequests: [],
          createdAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    userMap.set(p.email, user);
  }
  console.log(`✓ Provisioned ${userMap.size} community members.`);

  // [3/7] Generate authentic mutual follow network
  console.log('[3/7] Establishing interconnected follower graph...');
  const allUsers = Array.from(userMap.values());
  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    // Pick 4 to 8 peers to follow realistically
    const followIndices = [
      (i + 1) % allUsers.length,
      (i + 2) % allUsers.length,
      (i + 4) % allUsers.length,
      (i + 7) % allUsers.length,
      (i + 11) % allUsers.length
    ];
    const targetIds = followIndices.map(idx => allUsers[idx]._id);

    await User.updateOne(
      { _id: user._id },
      {
        $addToSet: { following: { $each: targetIds } },
        $set: { followingCount: targetIds.length }
      }
    );

    // Update their followers
    for (const tid of targetIds) {
      await User.updateOne(
        { _id: tid },
        {
          $addToSet: { followers: user._id }
        }
      );
    }
  }

  // Recalculate exact followersCount for everyone
  for (const u of allUsers) {
    const refreshed = await User.findById(u._id).select('followers following');
    await User.updateOne(
      { _id: u._id },
      {
        $set: {
          followersCount: refreshed.followers.length,
          followingCount: refreshed.following.length
        }
      }
    );
  }
  console.log('✓ Follower network established with genuine database relationships.');

  // [4/7] Seed Community Circles
  console.log('[4/7] Provisioning community circles...');
  const circleSeeds = [
    {
      name: 'Shutter & Lens',
      slug: 'shutter-and-lens',
      category: 'Photography',
      description: 'Dedicated to street photography, 35mm film grain, portraiture, and natural light.',
      creatorEmail: 'elena.rostova@looply.test',
      coverUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80',
      avatarUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Indie World Builders',
      slug: 'indie-world-builders',
      category: 'Gaming',
      description: 'A cozy corner for indie game creators, pixel artists, and interactive narrative designers.',
      creatorEmail: 'marcus.vance@looply.test',
      coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      avatarUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Slow Brew & Clay',
      slug: 'slow-brew-and-clay',
      category: 'Art',
      description: 'For lovers of single-origin pour-overs, handmade pottery, and patient morning rituals.',
      creatorEmail: 'sophia.chen@looply.test',
      coverUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      avatarUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const circleMap = new Map();
  for (const cs of circleSeeds) {
    const creator = userMap.get(cs.creatorEmail);
    const circle = await Circle.findOneAndUpdate(
      { slug: cs.slug },
      {
        $set: {
          name: cs.name,
          slug: cs.slug,
          category: cs.category,
          description: cs.description,
          creator: creator._id,
          coverUrl: cs.coverUrl,
          avatarUrl: cs.avatarUrl,
          isPrivate: false,
          updatedAt: new Date()
        },
        $addToSet: {
          members: { $each: allUsers.slice(0, 8).map(u => u._id) }
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    await Circle.updateOne({ _id: circle._id }, { $set: { memberCount: circle.members.length } });
    circleMap.set(cs.slug, circle);
  }
  console.log(`✓ Provisioned ${circleMap.size} community circles.`);

  // [5/7] Seed Feed Posts (Text-First Conversations) & Explore Posts (Visual Discoveries)
  console.log('[5/7] Publishing conversational and visual content...');

  // A. Feed Posts (Text-First Conversations, Questions & Daily Thoughts)
  const feedPostSeeds = [
    {
      authorEmail: 'julian.alvarez@looply.test',
      content: 'What is a book or essay you read once that fundamentally shifted how you look at ordinary, unhurried days? For me, it was Gaston Bachelard’s "The Poetics of Space". Would love community recommendations.',
      postType: 'normal',
      circleSlug: null
    },
    {
      authorEmail: 'sophia.chen@looply.test',
      content: 'There is a quiet art to waiting for water to reach 93°C when the whole city outside is in a hurry. Anyone else have a morning ritual that keeps your day grounded before the notifications start flowing?',
      postType: 'normal',
      circleSlug: 'slow-brew-and-clay'
    },
    {
      authorEmail: 'marcus.vance@looply.test',
      content: 'The hardest part of building something independent isn’t the technical implementation—it’s resisting the temptation to add feature after feature instead of polishing the one feeling that made the idea special in the first place.',
      postType: 'normal',
      circleSlug: 'indie-world-builders'
    },
    {
      authorEmail: 'hannah.becker@looply.test',
      content: 'My monstera cutting that spent all winter looking completely dormant just unfurled three massive fenestrated leaves this week! Sometimes things just need quiet time, patience, and indirect sunlight. 🌱',
      postType: 'normal',
      circleSlug: null
    },
    {
      authorEmail: 'arjun.mehta@looply.test',
      content: 'Trained through a torrential morning shower today. Wet shoes, cold wind, and easily the most invigorating 12k run of the season. What gets you moving when the weather tries to talk you out of it?',
      postType: 'normal',
      circleSlug: null
    },
    {
      authorEmail: 'chloe.dubois@looply.test',
      content: 'Question for creators: Do you feel digital tools have gotten too frantic lately with relentless badges and alerts? What makes an app or workspace feel genuinely calm and respectful of your attention?',
      postType: 'normal',
      circleSlug: null
    },
    {
      authorEmail: 'tariq.mansour@looply.test',
      content: 'Friendly reminder: The Perseid meteor shower peaks this weekend. If you have clear skies tonight, step away from screens for 20 minutes outside. It takes about 15 minutes for your rhodopsin to adapt, but the view is breathtaking.',
      postType: 'normal',
      circleSlug: null
    },
    {
      authorEmail: 'samuel.kim@looply.test',
      content: 'Just finished assembling a 65% gasket-mounted keyboard with hand-lubed linear switches. There is an unexpected calm in taking apart 70 tiny mechanical switches and tuning each spring by hand.',
      postType: 'normal',
      circleSlug: null
    },
    {
      authorEmail: 'zara.al-hassan@looply.test',
      content: 'Spent the afternoon recording oral histories at the city’s oldest community market. The baker who has worked the same hearth since 1974 told me: "Bread is just flour and patience, but people remember the patience." It stayed with me.',
      postType: 'normal',
      circleSlug: null
    },
    {
      authorEmail: 'nina.lindqvist@looply.test',
      content: 'Nordic food secret: adding a tiny pinch of crushed cardamom to sourdough rye dough elevates the toasted crust to something incredible. Warm butter is non-negotiable.',
      postType: 'normal',
      circleSlug: null
    }
  ];

  // B. Explore Posts (Visual Photography, Art & Split-Reality Storytelling)
  const explorePostSeeds = [
    {
      authorEmail: 'elena.rostova@looply.test',
      content: 'Midnight rain in Shinjuku. The way sodium street lamps blend with puddle reflections creates an accidental oil painting.',
      postType: 'normal',
      primaryMedia: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      circleSlug: 'shutter-and-lens'
    },
    {
      authorEmail: 'elena.rostova@looply.test',
      content: 'Tokyo Crossing Perspective: The Final long-exposure stream of light trails vs Behind the Reality standing in an alleyway for 45 minutes drenched in rain.',
      postType: 'splitReality',
      primaryMedia: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
      realityMedia: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80',
      circleSlug: 'shutter-and-lens'
    },
    {
      authorEmail: 'maya.patel@looply.test',
      content: 'Speculative Botanicals #04: Exploring bioluminescent mosses and solar collector foliage for a solarpunk city project.',
      postType: 'normal',
      primaryMedia: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      circleSlug: null
    },
    {
      authorEmail: 'liam.o_connor@looply.test',
      content: 'Dawn breaking over the Cuillin ridge in the Scottish Highlands. The wind was gusting at 35 knots, but the golden light on the basalt rock was unforgettable.',
      postType: 'normal',
      primaryMedia: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      circleSlug: null
    },
    {
      authorEmail: 'sophia.chen@looply.test',
      content: 'Ceramic Studio Perspective: The Final glazed celadon teapot vs Behind the Reality where three handles cracked during bone-dry trimming.',
      postType: 'splitReality',
      primaryMedia: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
      realityMedia: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
      circleSlug: 'slow-brew-and-clay'
    },
    {
      authorEmail: 'clara.novak@looply.test',
      content: 'Rhythm and geometry: Afternoon light casting diagonal shadows across the tiered terraces of the National Theatre.',
      postType: 'normal',
      primaryMedia: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      circleSlug: null
    },
    {
      authorEmail: 'devon.brooks@looply.test',
      content: 'Late-night sound lab: Analog patch cables, warmth of vacuum tubes, and tape echo feedback loops at 2 AM.',
      postType: 'normal',
      primaryMedia: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
      circleSlug: null
    },
    {
      authorEmail: 'tariq.mansour@looply.test',
      content: 'Seven hours of cumulative light integration on the Orion and Running Man nebulae. The cosmic dust clouds never cease to amaze me.',
      postType: 'normal',
      primaryMedia: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      circleSlug: null
    }
  ];

  const allPostSeeds = [...feedPostSeeds, ...explorePostSeeds];
  const postList = [];

  for (const p of allPostSeeds) {
    const author = userMap.get(p.authorEmail);
    const circle = p.circleSlug ? circleMap.get(p.circleSlug) : null;

    let post = await Post.findOne({ author: author._id, content: p.content });
    if (!post) {
      post = new Post({
        author: author._id,
        content: p.content,
        postType: p.postType,
        primaryMedia: p.primaryMedia || null,
        realityMedia: p.realityMedia || null,
        circle: circle ? circle._id : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000))
      });
      await post.save();
    }
    postList.push(post);
  }
  console.log(`✓ Provisioned ${postList.length} rich posts across Feed and Explore.`);

  // [6/7] Seed Cross-User Interactions (Likes & Comments)
  console.log('[6/7] Generating genuine community discussions and likes...');

  const commentTemplates = [
    { text: 'This resonates so deeply with what I’ve been thinking about this week.', commenter: 'maya.patel@looply.test' },
    { text: 'Incredible perspective! The patience really shows in the details.', commenter: 'elena.rostova@looply.test' },
    { text: 'Bookmarking this thought. Thanks for putting it into words so well!', commenter: 'julian.alvarez@looply.test' },
    { text: 'Couldn’t agree more. Simplicity and intention make all the difference.', commenter: 'chloe.dubois@looply.test' },
    { text: 'The second photo in the Split-Reality view gives so much respect to the process!', commenter: 'marcus.vance@looply.test' },
    { text: 'Adding this to my reading journal tonight. Great insight.', commenter: 'clara.novak@looply.test' },
    { text: 'This made my morning. Warm greetings from across the community!', commenter: 'hannah.becker@looply.test' }
  ];

  for (let i = 0; i < postList.length; i++) {
    const post = postList[i];
    // Add 2-4 likes per post
    const likers = allUsers.slice((i * 2) % allUsers.length, ((i * 2) % allUsers.length) + 4);
    for (const liker of likers) {
      await Like.updateOne(
        { post: post._id, user: liker._id },
        { $setOnInsert: { post: post._id, user: liker._id, createdAt: new Date() } },
        { upsert: true }
      );
    }

    // Add 1-2 thoughtful comments per post
    const commentData = commentTemplates[i % commentTemplates.length];
    const commenter = userMap.get(commentData.commenter);
    if (commenter && commenter._id.toString() !== post.author.toString()) {
      const existingComment = await Comment.findOne({
        post: post._id,
        author: commenter._id,
        content: commentData.text
      });
      if (!existingComment) {
        await Comment.create({
          post: post._id,
          author: commenter._id,
          content: commentData.text,
          createdAt: new Date()
        });
      }
    }
  }
  console.log('✓ Cross-user likes and comments successfully linked.');

  // [7/7] Seed Real Interactive Gameplay & Signature Experiences
  console.log('[7/7] Seeding Looply Play games, Feed Heist, and Mood-Orbit...');

  // Game 1: Who Knows Me? (Sophia Chen)
  const sophia = userMap.get('sophia.chen@looply.test');
  const marcus = userMap.get('marcus.vance@looply.test');
  const elena = userMap.get('elena.rostova@looply.test');
  const julian = userMap.get('julian.alvarez@looply.test');

  const whoKnowsMeChallenge = await GameChallenge.findOneAndUpdate(
    { title: 'How Well Do You Know Sophia?', gameType: 'who_knows_me' },
    {
      $set: {
        creator: sophia._id,
        gameType: 'who_knows_me',
        title: 'How Well Do You Know Sophia?',
        description: 'Test how well you know my favorite brew rituals, creative habits, and cozy weekend spots!',
        gameData: {
          questions: [
            {
              question: 'What is my absolute go-to morning coffee brew method?',
              options: ['Espresso machine', 'Pour-over (Hario V60)', 'French Press', 'Cold Brew']
            },
            {
              question: 'Where would I spend an entire rainy Sunday afternoon?',
              options: ['Pottery wheel studio', 'A packed shopping mall', 'Cinema marathon', 'Board game cafe']
            },
            {
              question: 'Which comfort snack can I never turn down?',
              options: ['Salted butter sourdough', 'Cotton candy', 'Extreme sour gummies', 'Store-bought chips']
            }
          ]
        },
        answerKey: {
          q0: 1, // Pour-over
          q1: 0, // Pottery wheel
          q2: 0  // Salted butter sourdough
        },
        participants: [
          { user: marcus._id, score: 2, userAnswers: { q0: 1, q1: 0, q2: 3 }, completedAt: new Date() },
          { user: elena._id, score: 3, userAnswers: { q0: 1, q1: 0, q2: 0 }, completedAt: new Date() },
          { user: julian._id, score: 2, userAnswers: { q0: 0, q1: 0, q2: 0 }, completedAt: new Date() }
        ],
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  // Game 2: Two Truths & A Lie (Liam O'Connor)
  const liam = userMap.get("liam.o_connor@looply.test");
  const maya = userMap.get('maya.patel@looply.test');
  const arjun = userMap.get('arjun.mehta@looply.test');

  const twoTruthsChallenge = await GameChallenge.findOneAndUpdate(
    { title: "Spot Liam's High-Altitude Lie!", gameType: 'two_truths_and_lie' },
    {
      $set: {
        creator: liam._id,
        gameType: 'two_truths_and_lie',
        title: "Spot Liam's High-Altitude Lie!",
        description: 'Two of these mountain stories happened to me for real. One is complete fiction. Can you guess which is the lie?',
        gameData: {
          prompt: 'Which of these three mountain stories is pure fiction?',
          statements: [
            'I once accidentally spent an entire freezing night in an abandoned Pyrenees stone shelter sharing my sleeping bag with three stray shepherd dogs.',
            'I completed a winter solo summit of Mount Fuji wearing lightweight snowshoes during a sub-zero blizzard.',
            'A cheeky alpine marmot in the Swiss Alps chewed through my backpack strap and stole half my trail journal.'
          ],
          explanation: 'Statement #2 is the lie! I have climbed Mount Fuji in summer sunrise, but winter solo summits in a blizzard are way beyond my survival threshold! The stray dogs and the notebook-thieving marmot are 100% true.'
        },
        answerKey: {
          lieIndex: 1,
          explanation: 'Statement #2 is the lie! I climbed Fuji in summer, not a winter blizzard.'
        },
        participants: [
          { user: maya._id, score: 1, userAnswers: { lieIndex: 1 }, completedAt: new Date() },
          { user: arjun._id, score: 0, userAnswers: { lieIndex: 0 }, completedAt: new Date() }
        ],
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  // Game 3: Emoji Riddles (Marcus Vance)
  const clara = userMap.get('clara.novak@looply.test');
  const samuel = userMap.get('samuel.kim@looply.test');

  const emojiChallenge = await GameChallenge.findOneAndUpdate(
    { title: 'Can You Decode This Classic Adventure Game?', gameType: 'emoji_challenge' },
    {
      $set: {
        creator: marcus._id,
        gameType: 'emoji_challenge',
        title: 'Can You Decode This Classic Adventure Game?',
        description: 'Translate these four emojis into the title of a legendary LucasArts pirate adventure game!',
        gameData: {
          emojis: '🐒 🏝️ 🏴‍☠️ ⚔️',
          category: 'Video Games',
          hint: 'Features an aspiring pirate named Guybrush Threepwood and insult sword-fighting!'
        },
        answerKey: {
          answer: 'Monkey Island'
        },
        participants: [
          { user: clara._id, score: 1, userAnswers: { answer: 'Monkey Island' }, completedAt: new Date() },
          { user: samuel._id, score: 1, userAnswers: { answer: 'The Secret of Monkey Island' }, completedAt: new Date() }
        ],
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  // Game 4: Picture Mystery (Tariq Mansour)
  const tariq = userMap.get('tariq.mansour@looply.test');
  const devon = userMap.get('devon.brooks@looply.test');

  const pictureChallenge = await GameChallenge.findOneAndUpdate(
    { title: 'Identify This Deep Space Cosmic Cloud', gameType: 'picture_mystery' },
    {
      $set: {
        creator: tariq._id,
        gameType: 'picture_mystery',
        title: 'Identify This Deep Space Cosmic Cloud',
        description: 'Take a close look at this dark nebula silhouette located in the constellation of Orion. What is its popular name?',
        gameData: {
          imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
          category: 'Astronomy',
          hint: 'Its iconic dark dust pillar resembles a proud equestrian silhouette!'
        },
        answerKey: {
          answer: 'Horsehead Nebula'
        },
        participants: [
          { user: devon._id, score: 1, userAnswers: { answer: 'Horsehead Nebula' }, completedAt: new Date() },
          { user: elena._id, score: 1, userAnswers: { answer: 'Horsehead' }, completedAt: new Date() }
        ],
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  console.log('✓ Provisioned 4 distinct gameplay challenges with active participant scores.');

  // Seed Feed Heist
  const heist = await FeedHeist.findOneAndUpdate(
    { title: 'The Midnight Signal Cipher' },
    {
      $set: {
        creator: elena._id,
        title: 'The Midnight Signal Cipher',
        description: 'A mystery left in neon reflections. Decode two photographic signal clues to reveal the secret meeting rooftop.',
        status: 'active',
        clues: [
          {
            order: 1,
            clueText: 'Search the wet street reflection where three lanterns form an equilateral triangle in Shinjuku.',
            hint: 'Look closely at the sodium lights reflected on the asphalt.',
            unlockParticipantThreshold: 0
          },
          {
            order: 2,
            clueText: 'Count the red paper lanterns hanging above the noodle alley entrance and reverse the characters.',
            hint: 'The alley with the steam rising into the night air.',
            unlockParticipantThreshold: 2
          }
        ],
        targetSolution: 'Omoide Yokocho',
        timeLimitHours: 72,
        startTime: new Date(),
        endTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
        participants: [
          { user: elena._id, joinedAt: new Date() },
          { user: marcus._id, joinedAt: new Date() },
          { user: maya._id, joinedAt: new Date() }
        ],
        participantCount: 3,
        submissions: [
          {
            user: marcus._id,
            answer: 'Golden Gai',
            isCorrect: false,
            submittedAt: new Date(),
            contributionNote: 'Checked the lantern count but got the wrong corner.'
          }
        ]
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✓ Provisioned Feed Heist with live participants and clues.');

  // Seed Mood-Orbit Room
  const moodRoom = await MoodOrbitRoom.findOneAndUpdate(
    { name: 'Lo-Fi Cafe & Creative Corner' },
    {
      $set: {
        name: 'Lo-Fi Cafe & Creative Corner',
        mood: 'creative',
        intention: 'Share late-night sketches, quiet background playlists, and work on creative ideas together.',
        creator: maya._id,
        status: 'active',
        maxParticipants: 20,
        participants: [
          { user: maya._id, userName: 'Maya Patel', userAvatar: maya.profile?.avatarUrl, joinedAt: new Date() },
          { user: devon._id, userName: 'Devon Brooks', userAvatar: devon.profile?.avatarUrl, joinedAt: new Date() },
          { user: sophia._id, userName: 'Sophia Chen', userAvatar: sophia.profile?.avatarUrl, joinedAt: new Date() }
        ],
        messages: [
          {
            sender: maya._id,
            senderName: 'Maya Patel',
            senderAvatar: maya.profile?.avatarUrl,
            content: 'Welcome everyone! Putting on some gentle tape loops while finishing this botanical illustration.',
            createdAt: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            sender: devon._id,
            senderName: 'Devon Brooks',
            senderAvatar: devon.profile?.avatarUrl,
            content: 'Just tuned my analog delay pedal to 120ms. The rain outside is the perfect natural accompaniment.',
            createdAt: new Date(Date.now() - 20 * 60 * 1000)
          },
          {
            sender: sophia._id,
            senderName: 'Sophia Chen',
            senderAvatar: sophia.profile?.avatarUrl,
            content: 'Late night pour-over of washed Ethiopian beans. Best creative atmosphere in town.',
            createdAt: new Date(Date.now() - 10 * 60 * 1000)
          }
        ],
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('✓ Provisioned Mood-Orbit room with active atmospheric messages.');

  console.log('================================================================');
  console.log('SYNTHETIC COMMUNITY SEED COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith('seed-synthetic-community.mjs')) {
  seedSyntheticCommunity().catch((err) => {
    console.error('Seed execution error:', err);
    process.exit(1);
  });
}
