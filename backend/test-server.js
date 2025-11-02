const express = require('express');
const app = express();

app.use(express.json());

// Direct route (should work)
app.post('/api/auth/signup', (req, res) => {
    console.log('Direct signup route hit!', req.body);
    res.json({ message: 'Direct route works!' });
});

// Using router
const authRouter = express.Router();
authRouter.post('/signup', (req, res) => {
    console.log('Router signup route hit!', req.body);
    res.json({ message: 'Router route works!' });
});
app.use('/api/auth', authRouter);

// Start
app.listen(5001, () => {
    console.log('Test server on port 5001');
});