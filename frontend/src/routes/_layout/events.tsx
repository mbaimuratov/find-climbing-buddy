import {
  Button,
  Container,
  Flex,
  Heading,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { EventCreate, EventsService } from "../../client";
import ActionsMenu from "../../components/Common/ActionsMenu";
import AddEvent from "../../components/Events/AddEvent";
import RegistrationDialog from "../../components/Events/RegistrationDialog";
import useAuth from "../../hooks/useAuth";

const eventsSearchSchema = z.object({
  page: z.number().catch(1),
});

export const Route = createFileRoute("/_layout/events")({
  component: Events,
  validateSearch: (search) => eventsSearchSchema.parse(search),
});

const PER_PAGE = 5;

function getEventsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      EventsService.listEvents({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["events", { page }],
  };
}

type EventData = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  owner_id: string;
};

function EventsTable({ onRegister, onWithdraw, registeredEvents }: { onRegister: (event: EventData) => void, onWithdraw: (event: EventData) => void, registeredEvents: Set<string> }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isPending, isPlaceholderData } = useQuery({
    ...getEventsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  });

  const events = data?.data || [];
  const hasNextPage = !isPlaceholderData && Array.isArray(events) && events.length === PER_PAGE;
  const hasPreviousPage = page > 1;

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getEventsQueryOptions({ page: page + 1 }));
    }
  }, [page, queryClient, hasNextPage]);

  return (
    <>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Description</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(4).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {Array.isArray(events) ? (
                events.map((event: EventData) => (
                  <Tr key={event.id} opacity={isPlaceholderData ? 0.5 : 1}>
                    <Td isTruncated maxWidth="150px">
                      {event.title}
                    </Td>
                    <Td
                      color={!event.description ? "ui.dim" : "inherit"}
                      isTruncated
                      maxWidth="150px"
                    >
                      {event.description || "N/A"}
                    </Td>
                    <Td>{new Date(event.date).toLocaleDateString()}</Td>
                    <Td>
                      <ActionsMenu type={"Event"} value={event} />
                      {registeredEvents.has(event.id) ? (
                        <Button ml={2} onClick={() => onWithdraw(event)}>Withdraw Registration</Button>
                      ) : (
                        <Button ml={2} onClick={() => onRegister(event)}>Register</Button>
                      )}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={4}>No events found</Td>
                </Tr>
              )}
            </Tbody>
          )}
        </Table>
      </TableContainer>
      <Flex
        gap={4}
        alignItems="center"
        mt={4}
        direction="row"
        justifyContent="flex-end"
      >
        <Button onClick={() => setPage(page - 1)} isDisabled={!hasPreviousPage}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button isDisabled={!hasNextPage} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </Flex>
    </>
  );
}

function Events() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get the logged-in user's information
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const { isOpen: isRegisterOpen, onOpen: onRegisterOpen, onClose: onRegisterClose } = useDisclosure();
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const toast = useToast();

  useEffect(() => {
    if (user) {
      EventsService.getUserRegisteredEvents()
        .then((response) => {
          setRegisteredEvents(new Set(response.data.map((event: EventData) => event.id)));
        })
        .catch((error) => {
          console.error("Failed to fetch registered events:", error);
        });
    }
  }, [user]);

  const handleAddEvent = (event: EventCreate) => {
    const newEvent: EventData = {
      ...event,
      id: crypto.randomUUID(), // Generate a unique ID for the new event
      owner_id: user?.id || "", // Assign the logged-in user's ID as the owner or an empty string if user is null or undefined
    };
    queryClient.setQueryData(['events'], (oldData: any) => {
      if (!oldData) return [newEvent];
      return [...oldData, newEvent];
    });
  };

  const handleRegisterClick = (event: EventData) => {
    setSelectedEvent(event);
    onRegisterOpen();
  };

  const handleRegisterSubmit = (data: any) => {
    console.log("Registration data:", data);
    EventsService.registerForEvent({ eventId: selectedEvent!.id })
      .then((response) => {
        console.log("Registration successful:", response);
        setRegisteredEvents((prev) => new Set(prev).add(selectedEvent!.id));
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast({
          title: "Registration successful.",
          description: "You have successfully registered for the event.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error("Registration failed:", error);
        toast({
          title: "Registration failed.",
          description: "There was an error registering for the event.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
    onRegisterClose();
  };

  const handleWithdrawClick = (event: EventData) => {
    EventsService.unregisterForEvent({ eventId: event.id })
      .then((response) => {
        console.log("Withdrawal successful:", response);
        setRegisteredEvents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(event.id);
          return newSet;
        });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast({
          title: "Withdrawal successful.",
          description: "You have successfully withdrawn from the event.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error("Withdrawal failed:", error);
        toast({
          title: "Withdrawal failed.",
          description: "There was an error withdrawing from the event.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  };

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Events Management
      </Heading>

      <Flex justifyContent="flex-end" mb={4}>
        <Button colorScheme="teal" onClick={onOpen}>
          Add Event
        </Button>
      </Flex>

      <EventsTable onRegister={handleRegisterClick} onWithdraw={handleWithdrawClick} registeredEvents={registeredEvents} />

      <AddEvent isOpen={isOpen} onClose={onClose} onAddEvent={handleAddEvent} />

      {selectedEvent && user && (
        <RegistrationDialog
          isOpen={isRegisterOpen}
          onClose={onRegisterClose}
          onSubmit={handleRegisterSubmit}
          user={{
            ...user,
            full_name: user.full_name || "No Name Provided",
          }}
        />
      )}
    </Container>
  );
}

export default Events;