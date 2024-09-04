const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = 3001;

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/medvault');
const db = mongoose.connection;
db.once('open', () => {
    console.log("Mongodb connection successful");
});

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    phoneno: String,
    gender: String,
    dob: String,
    password: String,
    prescriptions: [{ 
        prescription: String,
        date: { type: Date, default: Date.now } // Include date for each prescription, default value set to current date
    }], 
    tests: [{ 
        test: String,
        date: { type: Date, default: Date.now } // Include date for each test, default value set to current date
    }] 
});


const Users = mongoose.model("patient", userSchema);



// Route for processing signup form
app.post('/patient-signup', async (req, res) => {
    const { name, username, phoneno,gender,dob, password } = req.body;
    const user = new Users({
        name,
        username,
        phoneno,
        gender,
        dob,
        password
    });
    await user.save();
    console.log(user);
    res.redirect("/patientlog.html");

});


// Route for patient login
app.post('/patient-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const patient = await Users.findOne({ username, password });
        if (patient) {
            
            res.redirect("/patientportal.html");
        } else {
            res.send('<script>alert("Invalid Login Credentials!"); window.location.href = "/patientlog.html"</script>');
            //res.redirect("/patientlog.html");
        }
    } catch (error) {
        console.error('Error during patient login:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


const doctorSchema = new mongoose.Schema({
    name: String,
    username: String,
    phoneno: String,
    gender: String,
    dob: String,
    dept: String,
    password: String
});

const Doctors = mongoose.model("doctor", doctorSchema);

// Route for processing signup form
app.post('/doctor-signup', async (req, res) => {
    const { name, username, phoneno,gender,dob,dept, password } = req.body;
    const doctor = new Doctors({
        name,
        username,
        phoneno,
        gender,
        dob,
        dept,
        password
    });
    await doctor.save();
    //console.log(doctor);
    res.send('<script>alert("Successfully Registered!"); window.location.href = "/adminportal.html"</script>');

});

// Route for doctor login
app.post('/doctor-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const doctor = await Doctors.findOne({ username, password });
        if (doctor) {
            
            res.redirect("/doctorportal.html");
        } else {
            res.send('<script>alert("Invalid Login Credentials!"); window.location.href = "/doctorlogin.html"</script>');
            //res.redirect("/patientlog.html");
        }
    } catch (error) {
        console.error('Error during doctor login:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Route for serving HTML signup page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'patientsignup.html'));
});


// Appointment schema
const appointmentSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    department: String,
    doctor: String,
    doctorusername: String,
    date: String,
    time: String
  });
  
  const Appointment = mongoose.model('Appointment', appointmentSchema);

// Route to handle appointment booking
app.post('/book-appointment', async (req, res) => {
    const { name, email, phone, department, doctor, appointmentDate, appointmentTime } = req.body;
    
    try {
        // Find the doctor's username based on the selected doctor's name
        const doctorDetails = await Doctors.findOne({ name: doctor });
        
        if (!doctorDetails) {
            return res.status(400).send("Doctor not found");
        }

        // Create a new appointment object with the doctor's username included
        const newAppointment = new Appointment({
            name,
            email,
            phone,
            department,
            doctor,
            doctorusername: doctorDetails.username, // Assuming the username field exists in the Doctor model
            date: appointmentDate,
            time: appointmentTime
        });

        // Save the new appointment
        await newAppointment.save();

        // Redirect the user to a success page or display a success message
        res.send('<script>alert("Appointment Booked Successfully!"); window.location.href = "/patientportal.html"</script>');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error booking appointment");
    }
});

  
  // Route to fetch booked time slots for a specific date
  app.get('/get-booked-time-slots', async (req, res) => {
      const { date } = req.query;
      try {
          const bookedAppointments = await Appointment.find({ date: date }, 'time'); // Assuming 'time' is the field representing the time slot in the Appointment model
          const bookedTimeSlots = bookedAppointments.map(appointment => appointment.time);
          res.json(bookedTimeSlots);
      } catch (err) {
          res.status(500).send("Error fetching booked time slots");
      }
  });

    // Express route to get doctors by department
    app.get('/doctors', async (req, res) => {
        const department = req.query.department;
      
        try {
          // Query the database to find doctors based on the department
          const doctors = await Doctors.find({ dept: department });
      
          // Send the list of doctors for the selected department
          res.json(doctors);
        } catch (error) {
          // Return an error if there's any issue with the database query
          res.status(500).json({ error: 'Error fetching doctors' });
        }
      });

    const adminSchema = new mongoose.Schema({
        username: String,
        password: String
    });
    
    const Admin = mongoose.model("admin", adminSchema);
    
    // Route for admin login
    app.post('/admin-login', async (req, res) => {
        const { username, password } = req.body;
        console.log(username, password);
        try {
            // Query admin based on username
            const admin = await Admin.findOne({ username });
            
            // Check if admin exists and if the password matches
            if (admin) {
                res.redirect("/adminportal.html");
            } else {
                res.send('<script>alert("Invalid Login Credentials!"); window.location.href = "/adminlog.html"</script>');
            }
        } catch (error) {
            console.error('Error during admin login:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    //doctermanagement
    app.get('/doctormanagement', async (req, res) => {
        try {
            const doctors = await Doctors.find();
            res.json(doctors);
        } catch (error) {
            console.error('Error getting all doctors:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
    
    app.put('/doctormanagement/:id', async (req, res) => {
        const { id } = req.params;
        const newData = req.body;
        console.log(newData,id);
        try {
            const updatedDoctor = await Doctors.findByIdAndUpdate(id, newData, { new: true });
            if (!updatedDoctor) {
                return res.status(404).json({ message: 'Doctor not found' });
            }
            res.json({ message: 'Doctor updated successfully' });
        } catch (error) {
            console.error('Error updating doctor:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
    
    app.delete('/doctormanagement/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const deletedDoctor = await Doctors.findByIdAndDelete(id);
            if (deletedDoctor) {
                res.json({ message: 'Doctor deleted successfully' });
            } else {
                res.status(404).json({ message: 'Doctor not found' });
            }
        } catch (error) {
            console.error('Error deleting doctor:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });


    //patientmanagement
    app.get('/patientmanagement', async (req, res) => {
        try {
            const patients = await Users.find();
            console.log(patients);
            res.json(patients);
        } catch (error) {
            console.error('Error getting all patients:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
    
    app.put('/patientmanagement/:id', async (req, res) => {
        const { id } = req.params;
        const newData = req.body;
        console.log(newData,id);
        try {
            const updatedpatient = await Users.findByIdAndUpdate(id, newData, { new: true });
            if (!updatedpatient) {
                return res.status(404).json({ message: 'Patient not found' });
            }
            res.json({ message: 'Patient details updated successfully' });
        } catch (error) {
            console.error('Error updating patient data:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
    
    app.delete('/patientmanagement/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const deletedpatient = await Users.findByIdAndDelete(id);
            if (deletedpatient) {
                res.json({ message: 'Patient deleted successfully' });
            } else {
                res.status(404).json({ message: 'Patient not found' });
            }
        } catch (error) {
            console.error('Error deleting Patient:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    app.get('/displayappointments', async (req, res) => {
        try {
            const username = req.query.username;
            const appointments = await Appointment.find({ doctorusername : username });
            console.log(appointments);
    
            // Send the appointments as a response
            res.json(appointments);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    

    // Define file schema
const fileSchema = new mongoose.Schema({
    name: String,
    data: Buffer,
    contentType: String,
    source: String,
    username: String, // Added field for storing username
    recordName: String, // Added field for storing record name
    date: { type: Date, default: Date.now } // Added field for storing date, default value set to current date
});


// Create file model
const File = mongoose.model('File', fileSchema);

// Configure Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Handle file upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const newFile = new File({
            name: req.file.originalname,
            data: req.file.buffer,
            contentType: req.file.mimetype,
            source: req.body.source,
            username: req.body.username, // Retrieve username from request body
            recordName: req.body.recordName // Retrieve record name from request body
        });
        await newFile.save();
        res.status(201).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Endpoint to download files by ID
app.get('/file/:id', async (req, res) => {
    const fileId = req.params.id;

    try {
        // Find the file by ID
        const file = await File.findById(fileId);

        // If file not found, return 404
        if (!file) {
            return res.status(404).send('File not found');
        }

        // Set response headers
        res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
        res.setHeader('Content-Type', file.contentType);

        // Send the file data
        res.send(file.data);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to fetch patient data by username
app.get('/patient/:username', async (req, res) => {
    const username = req.params.username;

    try {
        // Find the patient by username
        const patient = await Users.findOne({ username });

        // If patient not found, return 404
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Find files associated with this patient
        const files = await File.find({ username });

        // Construct response data
        const responseData = {
            name: patient.name,
            dob: patient.dob,
            gender: patient.gender,
            reports: files
        };

        // Send response
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Endpoint to add prescription for a patient
app.post('/patient/:username/prescription', async (req, res) => {
    const { username } = req.params;
    const { prescription, date } = req.body;

    try {
        // Find the patient by username
        let patient = await Users.findOne({ username });

        // If patient not found, create a new one
        if (!patient) {
            patient = new Users({ username });
        }

        // Add prescription to the patient
        patient.prescriptions.push({ prescription, date });

        // Save the updated patient
        await patient.save();

        res.status(200).send('Prescription added successfully');
    } catch (error) {
        console.error('Error adding prescription:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to add test for a patient
app.post('/patient/:username/test', async (req, res) => {
    const { username } = req.params;
    const { test, date } = req.body;

    try {
        // Find the patient by username
        let patient = await Users.findOne({ username });

        // If patient not found, create a new one
        if (!patient) {
            patient = new Users({ username });
        }

        // Add test to the patient
        patient.tests.push({ test, date });

        // Save the updated patient
        await patient.save();

        res.status(200).send('Test added successfully');
    } catch (error) {
        console.error('Error adding test:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to fetch patient data by username
app.get('/prescription/:username', async (req, res) => {
    const username = req.params.username;
    try {
        // Find the patient by username
        const patient = await Users.findOne({ username });

        // If patient not found, return 404
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Send response with patient data
        res.json({
            prescriptions: patient.prescriptions,
            tests: patient.tests
        });
    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Serve the patient dashboard webpage
app.get('/patientdashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'patientdashboard.html'));
});

app.post('/adminupload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const newFile = new File({
            name: req.file.originalname,
            data: req.file.buffer,
            contentType: req.file.mimetype,
            source: req.body.source,
            username: req.body.username, // Retrieve username from request body
            recordName: req.body.recordName // Retrieve record name from request body
        });
        await newFile.save();
        res.status(201).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

