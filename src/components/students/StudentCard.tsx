import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Student } from '../../types';
import { Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudentCardProps {
  student: Student;
  index: number;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/students/${student.id}`}>
        <Card hoverable className="p-4 h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">{student.name}</h3>
          </div>
          
          {student.email && (
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <User size={16} className="mr-1" />
              <span>{student.email}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-500">
            <Calendar size={16} className="mr-1" />
            <span>Added: {new Date(student.created_at).toLocaleDateString()}</span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default StudentCard;