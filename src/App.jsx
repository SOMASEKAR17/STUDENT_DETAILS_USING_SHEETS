import { useEffect, useState } from "react";
import StudentModal from "./StudentModal";

// Your deployed Apps Script Web App URL
const API_URL =
  "https://script.google.com/macros/s/AKfycbz9Mi5l-zs-v0xjZ26x0fYJHBkkhFX-_OSK3RU3s6OTo_iLbOKuYyYKe7T_U2obDIpERw/exec";

// Constants (you can hardcode or pass via env)
const SHEET_ID = "1y7q3QW8Ibqzo5EFq2Ksloc5gP-TOsWrtQbeSRxntKTc";
const SHEET_NAME = "Records";

export default function App() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    "First Name": "",
    "Last Name": "",
    "Mobile Number": "",
    "Email ID": "",
    "Branch": "",
    "Address": "",
  });

  const fetchStudents = async () => {
    try {
      const res = await fetch(
        `${API_URL}?FN=ReadAll&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}`
      );
      const data = await res.json();
      const headers = data[0];
      const rows = data.slice(1).map((row, i) =>
        Object.fromEntries(row.map((cell, j) => [headers[j], cell]))
      );
      rows.forEach((student, index) => (student.__rowId = index + 1)); // row ID for Apps Script
      setStudents(rows);
      setStudents(rows);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataStr = encodeURIComponent(JSON.stringify(Object.values(formData)));
      await fetch(
        `${API_URL}?FN=Create&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}&DATA=${dataStr}`
      );
      setFormData({
        "First Name": "",
        "Last Name": "",
        "Mobile Number": "",
        "Email ID": "",
        "Branch": "",
        "Address": "",
      });
      fetchStudents();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl mb-4 font-bold">Student Management</h1>

      {/* Create Student Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 mb-6 bg-gray-100 p-4 rounded"
      >
        {Object.keys(formData).map((field) => (
          <div key={field} className="col-span-1">
            <label className="block mb-1 font-semibold">{field}</label>
            <input
              type="text"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        ))}
        <button
          type="submit"
          className="col-span-2 bg-blue-600 text-white py-2 rounded mt-2"
        >
          Create Student
        </button>
      </form>

      {/* Student List */}
      <div className="grid grid-cols-2 gap-4">
        {students.map((student, index) => (
          <div
            key={index}
            className="border p-4 rounded shadow cursor-pointer hover:bg-blue-50"
            onClick={() => setSelectedStudent(student)}
          >
            <p>
              <strong>
                {student["First Name"]} {student["Last Name"]}
              </strong>
            </p>
            <p>{student["Email ID"]}</p>
          </div>
        ))}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => {
            setSelectedStudent(null);
            fetchStudents(); // refresh after editing
          }}
        />
      )}
    </div>
  );
}
