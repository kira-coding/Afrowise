import {
  Box,
  Flex,
  HStack,
  Image,
  Text,
  InputGroup,
  Input,
  InputRightElement,
  Button,
  Icon,
  MenuButton,
  Menu,
  MenuList,
  Avatar,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  useDisclosure,
} from "@chakra-ui/react";
import { MdSearch, MdMenu } from "react-icons/md";
interface Props {


  toggle: () => void;

}


const NavBar = ({ toggle }: Props) => {

  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Flex justifyContent={`space-between`} alignItems={`center`} m={{base:"0",md:`0.5rem` }} gap={`2rem`}>
        <HStack gap={`0.7rem`}>
          <Button display={{ base: "flex", lg: `none` }} padding={`0`} onClick={toggle}>
            <Icon as={MdMenu} fontSize={{ base: `1rem`, md: `1.5rem` }} />
          </Button>
          <Box w={{ base: `1.7rem`, sm: "90px" }}>
            <Image src="/vite.svg" alt="The logo of Afro wise" w={{ base: `2.5rem`, md: "2.5rem" }} />
          </Box>
          <Text>Afrowise</Text>
        </HStack>
        <InputGroup display={{ base: "none", sm: "block" }}>
          <Input type="text" placeholder="search for courses" colorScheme="gray" />
          <InputRightElement><Button > <Icon as={MdSearch} fontSize={`larger`}></Icon></Button></InputRightElement>

        </InputGroup>
        <HStack display={{ base: "none", sm: "flex" }}>
          <Button variant={`outline`}>
            Login
          </Button>
          <Button>Sign up</Button>
        </HStack>
        <HStack display={{ base: "flex", sm: "none" }}>
          <Button p={0} onClick={onOpen}><Icon as={MdSearch} fontSize={`1.2rem`} fontWeight={`bold`}></Icon></Button>
          <Menu>
            <MenuButton><Avatar w={`2.5rem`} h={`2.5rem`} src="" /></MenuButton>
            <MenuList >
              <MenuItem >
                Login
              </MenuItem>
              <MenuItem  >
                Sign up
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>

          
            <InputGroup>
            <Input type="text" placeholder="search courses"  bg={`gray.200`} colorScheme="gray"/>
            <InputRightElement><Button> <Icon as={MdSearch}></Icon></Button></InputRightElement>            </InputGroup>
          
        </ModalContent>
      </Modal>
    </>

  )
}

export default NavBar