const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Directory for daily entries
const dailyEntriesDir = './daily-entries';

// Function to read all files in a directory
const readFilesInDir = (dirPath) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
};

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/journal', (req, res) => {
    res.render('journal');
});

app.post('/save-entry', (req, res) => {
    const entry = req.body.entry;
    const currentDate = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const fileName = `journal_${currentDate}.txt`;
    const filePath = path.join(dailyEntriesDir, fileName);

    const journalContent = `Date: ${currentDate}\n\n${entry}\n\n`;

    fs.writeFile(filePath, journalContent, { flag: 'wx' }, (err) => {
        if (err) {
            if (err.code === 'EEXIST') {
                console.error('Journal entry already exists');
            } else {
                throw err;
            }
        } else {
            console.log('Journal entry saved!');
        }
        res.redirect('/');
    });
});

app.get('/previous-entries', async (req, res) => {
    try {
        const files = await readFilesInDir(dailyEntriesDir);
        const entryDates = files.map((file) => {
            return file.replace('journal_', '').replace('.txt', '');
        });
        res.render('previous-entries', { entryDates });
    } catch (err) {
        console.error('Error reading daily entries:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/view-entry/:date', (req, res) => {
    const date = req.params.date;
    const fileName = `journal_${date}.txt`;
    const filePath = path.join(dailyEntriesDir, fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading entry:', err);
            res.status(404).send('Entry not found');
        } else {
            res.render('view-entry', { entryDate: date, entryContent: data });
        }
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
