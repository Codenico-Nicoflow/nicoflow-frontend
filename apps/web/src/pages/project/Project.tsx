import { useParams } from 'react-router-dom';

const Project = () => {
  const { id } = useParams();
  return <div>Project {id} is here</div>;
};

export default Project;
