import { useNavigate } from 'react-router-dom';
import WeatherModal from '@/components/WeatherModal';

export default function Weather() {
  const navigate = useNavigate();
  return <WeatherModal onClose={() => navigate('/')} />;
}