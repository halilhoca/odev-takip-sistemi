import React from 'react';
import AssignmentCard from './AssignmentCard';
import AssignmentCardAlt from './AssignmentCardAlt';

interface AssignmentCardWrapperProps {
  assignment: any;
  index: number;
  isStudent?: boolean;
  onToggleStatus?: (id: string, status: boolean) => void;
  variant?: 'default' | 'alternative'; // Choose which design to show
}

const AssignmentCardWrapper: React.FC<AssignmentCardWrapperProps> = ({
  assignment,
  index,
  isStudent = false,
  onToggleStatus,
  variant = 'default'
}) => {
  if (variant === 'alternative') {
    return (
      <AssignmentCardAlt 
        assignment={assignment}
        index={index}
        isStudent={isStudent}
        onToggleStatus={onToggleStatus}
      />
    );
  }

  return (
    <AssignmentCard 
      assignment={assignment}
      index={index}
      isStudent={isStudent}
      onToggleStatus={onToggleStatus}
    />
  );
};

export default AssignmentCardWrapper;
