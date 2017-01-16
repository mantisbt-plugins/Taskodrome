<?php

# Copyright (c) 2015 Maxim Kuzmin
# Licensed under the Apache License

class TaskodromePlugin extends MantisPlugin
{
  public function register()
  {
    $this->name = plugin_lang_get("title");
    $this->description = plugin_lang_get("description");
    $this->page = 'config_page';

    $this->version = "0.1";
    $this->requires = array(
      "MantisCore" => "2.0.0",
    );

    $this->author = "Maxim Kuzmin";
    $this->contact = "maxriderg@gmail.com";
    $this->url = "https://github.com/mantisbt-plugins/Taskodrome";
  }

  public function hooks()
  {
    return array(
      "EVENT_MENU_MAIN" => "menu",
    );
  }

  public function menu()
  {
    $links = array();
    $links[] = array(
      'title' => plugin_lang_get("board"),
      'url' => plugin_page("main"),
      'icon' => 'fa-columns'
    );
    return $links;
  }

  public function config()
  {
    $status_list = explode(',', lang_get( 'status_enum_string' ));
    foreach( $status_list as $key => $value ) {
      $status_list[$key] = substr($value, strpos($value, ':') + 1);
    }
    return array(
      "status_board_order_default" => $status_list,
      "status_board_order" => $status_list,
      "cooldown_period_days" => 14,
      "cooldown_period_hours" => 0
    );
  }
}
