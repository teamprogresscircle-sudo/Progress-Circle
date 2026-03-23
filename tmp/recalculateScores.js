const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Load User model
const User = require(path.join(__dirname, '..', 'backend', 'models', 'User'));

async function migrate() {
    try {
        console.log('Connecting to database...');
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI not found in .env');
        
        await mongoose.connect(uri);
        console.log('Connected to MongoDB.');

        const users = await User.find({});
        console.log(`Updating ${users.length} users...`);

        for (const user of users) {
            // Trigger pre('save') hook
            await user.save();
            console.log(`Updated ${user.name}: Score = ${user.totalScore}, Points = ${user.points}`);
        }

        console.log('Migration complete successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
