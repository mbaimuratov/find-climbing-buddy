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
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { EventCreate, EventsService } from "../../client";
import ActionsMenu from "../../components/Common/ActionsMenu";
import AddEvent from "../../components/Events/AddEvent";

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

function EventsTable() {
  const queryClient = useQueryClient();
  const { page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const setPage = (page: number) =>
    navigate({ search: (prev) => ({ ...prev, page }) });

  const {
    data,
    isPending,
    isPlaceholderData,
  } = useQuery({
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
                {new Array(5).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {Array.isArray(events) ? (
                events.map((event) => (
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

  type Event = {
    id: string;
    title: string;
    description?: string | null;
    date: string;
  };

  const handleAddEvent = (event: EventCreate) => {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(), // Generate a unique ID for the new event
    };
    queryClient.setQueryData(['events'], (oldData: any) => {
      if (!oldData) return [newEvent];
      return [...oldData, newEvent];
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

      <EventsTable />

      <AddEvent isOpen={isOpen} onClose={onClose} onAddEvent={handleAddEvent} />
    </Container>
  );
}

export default Events;