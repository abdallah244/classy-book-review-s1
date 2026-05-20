import { connect, disconnect, model, Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/classy-book';

async function seed() {
  console.log('🚀 Starting Social Seeding...');

  try {
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define temporary schemas for seeding to avoid complex imports
    const UserSchema = new Schema({
      name: String,
      email: { type: String, unique: true },
      password: { type: String },
      role: { type: String, default: 'student' },
      isSocialBanned: { type: Boolean, default: false },
    });
    const User: any = model('User', UserSchema);

    // Clear existing social users to fix the role enum issue
    await User.deleteMany({
      email: {
        $in: ['ahmed@example.com', 'sara@example.com', 'john@example.com'],
      },
    });
    console.log('🗑️ Cleared existing test users');

    const PostSchema = new Schema({
      author: { type: Schema.Types.ObjectId, ref: 'User' },
      content: String,
      media: [String],
      type: { type: String, default: 'text' },
      reactions: { type: Map, of: Number, default: {} },
      likesCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      repostCount: { type: Number, default: 0 },
      visibility: { type: String, default: 'public' },
      createdAt: { type: Date, default: Date.now },
    });
    const Post: any = model('Post', PostSchema);

    const GroupSchema = new Schema({
      name: String,
      description: String,
      creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
      privacy: { type: String, default: 'public' },
      membersCount: { type: Number, default: 1 },
      createdAt: { type: Date, default: Date.now },
    });
    const Group: any = model('Group', GroupSchema);

    // 2. Create Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345678', salt);

    const users = [
      {
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        password: hashedPassword,
        role: 'student',
      },
      {
        name: 'Sara Mohamed',
        email: 'sara@example.com',
        password: hashedPassword,
        role: 'student',
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'teacher',
      },
    ];

    const createdUsers: any[] = [];
    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const newUser = await User.create(u);
        createdUsers.push(newUser);
        console.log(`👤 Created User: ${u.name}`);
      } else {
        createdUsers.push(existing);
      }
    }

    // 3. Create Posts
    const postsData = [
      {
        author: createdUsers[0]._id,
        content:
          'مرحباً بكم في منصة Classy Book! 📚 متحمس جداً لبدء رحلتي التعليمية هنا.',
        reactions: { like: 5, love: 2 },
        likesCount: 7,
      },
      {
        author: createdUsers[1]._id,
        content:
          'هل جربتم ميزة المجموعات الجديدة؟ رائعة جداً للتواصل مع الزملاء! 💬',
        media: [
          'https://res.cloudinary.com/dcztdup1m/image/upload/v1/classy-book/samples/group-preview.jpg',
        ],
        type: 'image',
        reactions: { wow: 3, like: 10 },
        likesCount: 13,
      },
      {
        author: createdUsers[2]._id,
        content:
          'نصيحة اليوم: الاستمرارية هي مفتاح النجاح في تعلم أي لغة برمجية جديدة. 💪 #برمجة #تعلم',
        reactions: { like: 25, love: 15, haha: 1 },
        likesCount: 41,
      },
    ];

    for (const p of postsData) {
      await Post.create(p);
    }
    console.log('📝 Created Sample Posts');

    // 4. Create Groups
    const groupsData = [
      {
        name: 'محبي البرمجة',
        description: 'مجموعة لمناقشة كل ما يخص عالم البرمجة والتطوير.',
        creatorId: createdUsers[0]._id,
      },
      {
        name: 'اللغة الإنجليزية',
        description: 'لنتحدث الإنجليزية معاً ونطور مهاراتنا.',
        creatorId: createdUsers[1]._id,
      },
      {
        name: 'نادي الكتاب',
        description: 'كل أسبوع نناقش كتاباً جديداً.',
        creatorId: createdUsers[2]._id,
      },
    ];

    for (const g of groupsData) {
      const existing = await Group.findOne({ name: g.name });
      if (!existing) {
        await Group.create(g);
        console.log(`👥 Created Group: ${g.name}`);
      }
    }

    console.log('✨ Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
  } finally {
    await disconnect();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
