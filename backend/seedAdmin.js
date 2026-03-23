const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedAdmin = async () => {
    try {
        // Use the direct connection string to bypass DNS/SRV issues on Windows
        const directURI = 'mongodb://youssefmohussein:Xn56lD9zVfW2iYQ1@ac-p5vtvtl-shard-00-00.u9gfgzs.mongodb.net:27017,ac-p5vtvtl-shard-00-01.u9gfgzs.mongodb.net:27017,ac-p5vtvtl-shard-00-02.u9gfgzs.mongodb.net:27017/progress-circle?ssl=true&replicaSet=atlas-2ys74c-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(directURI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@progresscircle.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.email);
            // existingAdmin.password = 'Youssef@2005';
            // await existingAdmin.save();
            // console.log('Admin password reset successfully');
        } else {
            console.log('Creating default admin user...');

            // Note: The User schema pre-save hook handles hashing the password
            const adminUser = new User({
                name: 'System Admin',
                email: adminEmail,
                password: 'Youssef@2005',
                isAdmin: true
            });

            await adminUser.save();
            console.log('Admin user created successfully!');
            console.log('Email:', adminEmail);
            console.log('Password: Youssef@2005');
        }

        mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('Error seeding admin:', error);
        mongoose.connection.close();
        process.exit(1);
    }
};

seedAdmin();
