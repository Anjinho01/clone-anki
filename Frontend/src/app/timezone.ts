import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Fuso padrão da aplicação
dayjs.tz.setDefault('America/Fortaleza'); // ou 'America/Sao_Paulo'
