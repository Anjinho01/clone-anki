import classNames from '@fuse/utils/classNames';
import FullCalendar from '@fullcalendar/react';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions } from '@fullcalendar/core';

type EventColors = Record<
  string,
  {
    bg: string;
    text: string;
  }
>;

interface CalendarViewProps extends CalendarOptions {
  wrapperClass?: string;
  eventColors?: (colors: EventColors) => EventColors;
}

const defaultColorList: Record<
  string,
  {
    bg: string;
    text: string;
  }
> = {
  red: {
    bg: 'bg-[#f44336]',
    text: 'text-gray-900',
  },
  orange: {
    bg: 'bg-[#ff9800]',
    text: 'text-gray-900',
  },
  yellow: {
    bg: 'bg-[#ffeb3b]',
    text: 'text-gray-900',
  },
  green: {
    bg: 'bg-[#81c784]',
    text: 'text-gray-900',
  },
  blue: {
    bg: 'bg-[#64b5f6]',
    text: 'text-gray-900',
  },
  purple: {
    bg: 'bg-[#ba68c8]',
    text: 'text-gray-900',
  },
  grey: {
    bg: 'bg-[#9e9e9e]',
    text: 'text-gray-900',
  },
};

const CalendarView = (props: CalendarViewProps) => {
  const { wrapperClass, eventColors = () => defaultColorList, ...rest } = props;

  return (
    <div className={classNames('calendar', wrapperClass)}>
      <FullCalendar
        // initialView="dayGridMonth"
        initialView="timeGridDay"
        locale={ptBrLocale}
        headerToolbar={{
          left: 'title',
          center: '',
          right: 'dayGridMonth,timeGridWeek,timeGridDay prev,next',
        }}
        eventContent={(arg) => {
          const { extendedProps } = arg.event;
          const { isEnd, isStart } = arg;
          return (
            <div
              className={classNames(
                'custom-calendar-event',
                extendedProps.eventColor
                  ? (eventColors(defaultColorList) || defaultColorList)[extendedProps.eventColor]
                      ?.bg
                  : '',
                extendedProps.eventColor
                  ? (eventColors(defaultColorList) || defaultColorList)[extendedProps.eventColor]
                      ?.text
                  : '',
                isEnd &&
                  !isStart &&
                  '!rtl:rounded-tr-none !rtl:rounded-br-none rounded-tl-none! rounded-bl-none!',
                !isEnd &&
                  isStart &&
                  '!rtl:rounded-tl-none !rtl:rounded-bl-none rounded-tr-none! rounded-br-none!'
              )}
            >
              {!(isEnd && !isStart) && <span>{arg.timeText}</span>}
              <span className="ml-1 font-bold rtl:mr-1">{arg.event.title}</span>
            </div>
          );
        }}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        {...rest}
      />
    </div>
  );
};

export default CalendarView;
