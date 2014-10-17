<?php
    sleep(1);

    function cmp_id($a, $b)
    {
        $dir = $_GET["sort_direction"];
        if($dir == "DESC" || $dir == "descending")
            return $b->id - $a->id;

        return $a->id - $b->id;
    }

    function cmp_value($a, $b)
    {
        $dir = $_GET["sort_direction"];
        if($dir == "DESC" || $dir == "descending")
           return strcmp($b->value, $a->value);

        return strcmp($a->value, $b->value);
    }

    class Item {
        public $id;
        public $value;
        public $children;
    }

    $items = array();
    for($i = 0; $i < 35; $i++){
        $id = $i + 1;
        $item = new Item;
        $item->id = $id;
        $item->value = "My Val $id";

        if($id % 2 == 0){
            $children = array();
            for($j = 0; $j < $id / 2; $j++){
                $cId = $j + 1;
                $child = new Item;
                $child->id = "$id.$cId";
                $child->value = "My Child Val $id.$cId";
                $children[] = $child;
            }
            $item->children = $children;
        }

        $items[] = $item;
    }
    $total = sizeof($items);
    $sortCol = $_GET["sort_column"];
    $sortDir = $_GET["sort_direction"];

    if($sortCol == "id"){
        usort($items, "cmp_id");
    }

    if($sortCol == "value"){
            usort($items, "cmp_value");
        }

    //echo "Page Size:" . $_GET["pageSize"] . "<br/>";
    $limit = $_GET["limit"];
    if(!empty($limit) && $limit != "-1"){
        $page = empty($_GET["page"]) ? 1 : $_GET["page"];
        $start = ($page - 1) * $limit;
        //echo "Page:" . $page . "<br/>";
        $items = array_slice($items, $start, $limit);
    }
    $arr = array ('total'=>$total,'items'=>$items);

    header('Content-Type: application/json');
    echo json_encode($arr);
?>