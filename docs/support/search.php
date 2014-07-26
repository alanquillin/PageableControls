<?php
    sleep(1);
    $query = $_GET['query'];
    $page = $_GET['page'];
    $page = empty($page) ? 1 : $page;
    $limit = $_GET['limit'];

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

    $found_items = array();
    foreach($items as $item){
        if(empty($query)){
            $found_items[] = $item;
        }
        else{
            $pos = strpos($item->value, $query);

            if($pos !== false)
                $found_items[] = $item;
        }
    }

    $total = sizeof($found_items);

    if(!empty($limit) && $limit != "-1"){
        $start = ($page - 1) * $limit;
        $found_items = array_slice($found_items, $start, $limit);
    }

    $arr = array ('total'=>$total,'items'=>$found_items);

    header('Content-Type: application/json');
    echo json_encode($arr);

?>