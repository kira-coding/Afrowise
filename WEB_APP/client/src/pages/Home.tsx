import { useState } from "react"
import NavBar from "../components/NavBar"
import { Box, Grid, GridItem, SimpleGrid, } from "@chakra-ui/react"




const Home = () => {
  const [isOpen, setIsOpen] = useState(true)


  return (
    <Grid templateAreas={{base:isOpen?`"nav nav" "aside main"` :`"nav nav" "main main"`} }templateRows={`1fr 8fr`} templateColumns={`1fr 2fr`}>
      <GridItem area={"nav"}>
      <NavBar toggle={() => { setIsOpen(!isOpen) }} /></GridItem>


      <GridItem area={"aside"}> 
        <Box bg="orange" minW={`100%`} display={isOpen ?"flex":"none"} minHeight={`100%`}>hello</Box>
      </GridItem>
      <GridItem area={"main"}>
        <SimpleGrid minChildWidth={`130px`} spacing={'10px'}>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$2</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
          <Box  h={'200px'} bg={`Yellow`}>Hello$1</Box>
        </SimpleGrid>
      </GridItem>
    </Grid>
  )
}

export default Home